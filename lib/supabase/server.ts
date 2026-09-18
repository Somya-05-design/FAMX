import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignored when called from Server Components during render.
          }
        },
      },
    }
  );
}

export async function getServerSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: dbUser } = await supabase
    .from("User")
    .select("role, email, name, avatarUrl")
    .eq("id", user.id)
    .single();

  if (dbUser) {
    return {
      user: {
        id: user.id,
        email: dbUser.email,
        role: dbUser.role as "CLIENT" | "ADMIN",
        name: dbUser.name,
        avatarUrl: dbUser.avatarUrl,
      },
    };
  }

  // Fallback for new OAuth users
  try {
    const { prisma } = await import("@/lib/prisma");
    const userEmail = user.email?.trim().toLowerCase() ?? "";
    const userName = user.user_metadata?.full_name || user.user_metadata?.name || userEmail.split("@")[0] || "User";

    let pUser = await prisma.user.findFirst({
      where: {
        OR: [
          { id: user.id },
          ...(userEmail ? [{ email: userEmail }] : []),
        ],
      },
    });

    if (pUser) {
      pUser = await prisma.user.update({
        where: { id: pUser.id },
        data: {
          id: user.id,
          email: userEmail || pUser.email,
          name: pUser.name || userName,
        },
      });
    } else {
      pUser = await prisma.user.create({
        data: {
          id: user.id,
          email: userEmail,
          name: userName,
          role: "CLIENT",
        },
      });
    }

    return {
      user: {
        id: user.id,
        email: pUser.email,
        role: pUser.role as "CLIENT" | "ADMIN",
        name: pUser.name,
        avatarUrl: pUser.avatarUrl,
      },
    };
  } catch (err) {
    console.error("getServerSession fallback error:", err);
    return {
      user: {
        id: user.id,
        email: user.email ?? "",
        role: "CLIENT" as const,
        name: user.user_metadata?.full_name || user.user_metadata?.name || "User",
        avatarUrl: null,
      },
    };
  }
}
