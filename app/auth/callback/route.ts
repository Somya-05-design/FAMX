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
        const userEmail = user.email?.trim().toLowerCase() ?? "";
        const userName = user.user_metadata?.full_name || user.user_metadata?.name || userEmail.split("@")[0] || "User";

        let existing = await prisma.user.findFirst({
          where: {
            OR: [
              { id: user.id },
              ...(userEmail ? [{ email: userEmail }] : []),
            ],
          },
        });

        if (existing) {
          await prisma.user.update({
            where: { id: existing.id },
            data: {
              id: user.id,
              email: userEmail || existing.email,
              name: existing.name || userName,
            },
          });
        } else {
          await prisma.user.create({
            data: {
              id: user.id,
              email: userEmail,
              name: userName,
              role: "CLIENT",
            },
          });
        }
      } catch (dbErr) {
        console.error("Failed to upsert OAuth user in DB:", dbErr);
      }

      const targetPath = next.startsWith("/") ? next : "/" + next;
      return NextResponse.redirect(`${origin}${targetPath}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=Could not authenticate user`);
}
