import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/supabase/server";

export default async function IndexPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  if (session.user.role === "ADMIN") {
    redirect("/admin");
  } else {
    redirect("/overview");
  }
}
