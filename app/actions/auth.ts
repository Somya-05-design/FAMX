"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function signInWithEmail(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const next = (formData.get("next") as string) || "/overview";

  const supabase = await createClient();
  const { error, data } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  // Lookup user role to determine where to redirect
  const { prisma } = await import("@/lib/prisma");
  const dbUser = await prisma.user.findUnique({
    where: { id: data.user.id },
  });

  const role = dbUser?.role;
  const destination = role === "ADMIN" ? "/admin" : next;

  redirect(destination);
}

export async function signUpWithEmail(prevState: any, formData: FormData) {
  // SECURITY: Public signup tab strictly creates CLIENT-role accounts.
  // Admin accounts are provisioned manually per tasks.md Phase 1.
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;
  const next = formData.get("next") as string || "";

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        role: "CLIENT", // Strictly CLIENT role
      },
    },
  });

  if (error) {
    return { error: error.message };
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

