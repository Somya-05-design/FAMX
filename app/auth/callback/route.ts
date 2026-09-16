import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/overview";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data?.user) {
      try {
        const { prisma } = await import("@/lib/prisma");
        const user = data.user;
        const userName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "User";

        await prisma.user.upsert({
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
      } catch (dbErr) {
        console.error("Failed to upsert OAuth user in DB:", dbErr);
      }

      const targetPath = next.startsWith("/") ? next : "/" + next;
      return NextResponse.redirect(`${origin}${targetPath}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=Could not authenticate user`);
}
