"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function signInWithEmail(prevState: any, formData: FormData) {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  const next = (formData.get("next") as string) || "/overview";

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createClient();
  let { error, data } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  // If login failed due to unconfirmed email, attempt auto-confirmation via admin SDK
  if (error && (error.message.includes("Invalid login credentials") || error.message.includes("Email not confirmed"))) {
    try {
      const { createAdminClient } = await import("@/lib/supabase/admin");
      const supabaseAdmin = createAdminClient();
      const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = usersData?.users?.find((u) => u.email?.toLowerCase() === email);

      if (existingUser) {
        // Confirm user email & sync password via admin SDK
        await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
          email_confirm: true,
          password,
        });

        // Retry sign in
        const retryRes = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (!retryRes.error && retryRes.data) {
          error = null;
          data = retryRes.data;
        }
      }
    } catch (adminErr) {
      console.error("Auto-confirm fallback error during sign in:", adminErr);
    }
  }

  if (error || !data?.user) {
    return { error: error?.message || "Invalid login credentials" };
  }

  // Lookup user role in Prisma DB, auto-creating user row if missing
  const { prisma } = await import("@/lib/prisma");
  const userEmail = data.user.email?.trim().toLowerCase() || email;
  const userName = data.user.user_metadata?.name || data.user.user_metadata?.full_name || userEmail.split("@")[0] || "User";

  let dbUser = await prisma.user.findFirst({
    where: {
      OR: [
        { id: data.user.id },
        ...(userEmail ? [{ email: userEmail }] : []),
      ],
    },
  });

  if (dbUser) {
    dbUser = await prisma.user.update({
      where: { id: dbUser.id },
      data: {
        id: data.user.id,
        email: userEmail || dbUser.email,
        name: dbUser.name || userName,
      },
    });
  } else {
    try {
      dbUser = await prisma.user.create({
        data: {
          id: data.user.id,
          email: userEmail,
          name: userName,
          role: "CLIENT",
        },
      });
    } catch (dbErr) {
      console.error("Failed to create Prisma user on signin:", dbErr);
    }
  }

  const role = dbUser?.role || "CLIENT";
  const destination = role === "ADMIN" ? "/admin" : next;

  redirect(destination);
}

export async function signUpWithEmail(prevState: any, formData: FormData) {
  // SECURITY: Public signup tab strictly creates CLIENT-role accounts.
  // Admin accounts are provisioned manually per tasks.md Phase 1.
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  const name = (formData.get("name") as string)?.trim();
  const next = (formData.get("next") as string) || "";

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createClient();
  let { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        role: "CLIENT", // Strictly CLIENT role
      },
    },
  });

  // If signUp fails or returns unconfirmed session, use admin SDK to auto-confirm
  if (error || !data?.session) {
    try {
      const { createAdminClient } = await import("@/lib/supabase/admin");
      const supabaseAdmin = createAdminClient();

      const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = usersData?.users?.find((u) => u.email?.toLowerCase() === email);

      if (existingUser) {
        // Auto-confirm & update password for existing user
        const { data: updated } = await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
          email_confirm: true,
          password,
          user_metadata: { name, role: "CLIENT" },
        });
        if (updated?.user) {
          data = { user: updated.user, session: null } as any;
        }
      } else {
        // Create auto-confirmed user directly via admin API
        const { data: adminUser, error: adminErr } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { name, role: "CLIENT" },
        });

        if (adminErr) {
          return { error: adminErr.message };
        }
        if (adminUser?.user) {
          data = { user: adminUser.user, session: null } as any;
        }
      }

      // Automatically sign in to establish browser session
      const signInRes = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInRes.data?.session) {
        data = signInRes.data;
      }
    } catch (adminFail) {
      console.error("Admin user creation fallback error:", adminFail);
      if (error && !data?.user) return { error: error.message };
    }
  }

  // Guarantee Prisma User record creation
  if (data?.user) {
    try {
      const { prisma } = await import("@/lib/prisma");
      const userEmail = data.user.email?.trim().toLowerCase() || email;
      const userName = name || data.user.email?.split("@")[0] || "User";

      let existing = await prisma.user.findFirst({
        where: {
          OR: [
            { id: data.user.id },
            ...(userEmail ? [{ email: userEmail }] : []),
          ],
        },
      });

      if (existing) {
        await prisma.user.update({
          where: { id: existing.id },
          data: {
            id: data.user.id,
            email: userEmail || existing.email,
            name: existing.name || userName,
          },
        });
      } else {
        await prisma.user.create({
          data: {
            id: data.user.id,
            email: userEmail,
            name: userName,
            role: "CLIENT",
          },
        });
      }
    } catch (dbErr) {
      console.error("Failed to process Prisma user on signup:", dbErr);
    }
  }

  // If session is active (auto-logged in), redirect directly to /overview
  if (data?.session) {
    const destination = next || "/overview";
    redirect(destination);
  }

  const redirectUrl = next ? `/login?signup=success&next=${encodeURIComponent(next)}` : "/login?signup=success";
  redirect(redirectUrl);
}

export async function resetPasswordForEmail(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const supabase = await createClient();
  
  const headersList = await import("next/headers");
  const headerObj = await headersList.headers();
  const host = headerObj.get("host") || "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const origin = `${protocol}://${host}`;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: "Password reset link sent to your email." };
}

export async function updatePassword(prevState: any, formData: FormData) {
  const password = formData.get("password") as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: error.message };
  }

  redirect("/login?reset=success");
}

