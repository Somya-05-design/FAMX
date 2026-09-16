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
    .select("role, email, name")
    .eq("id", user.id)
    .single();

  if (dbUser) {
    return {
      user: {
        id: user.id,
        email: dbUser.email,
        role: dbUser.role as "CLIENT" | "ADMIN",
        name: dbUser.name,
      },
    };
  }

  // Fallback for new OAuth users
  try {
    const { prisma } = await import("@/lib/prisma");
    const userName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "User";

    const pUser = await prisma.user.upsert({
      where: { id: user.id },
      update: {
        email: user.email ?? "",
        name: userName,
      },
      create: {
        id: user.id,
        email: user.email ?? "",
        name: userName,
        role: "CLIENT",
      },
    });

    return {
      user: {
        id: user.id,
        email: pUser.email,
        role: pUser.role as "CLIENT" | "ADMIN",
        name: pUser.name,
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
      },
    };
  }
}
