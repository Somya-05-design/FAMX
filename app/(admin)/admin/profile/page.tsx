import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/data/users";
import { ProfileView } from "@/components/ProfileView";

export default async function AdminProfilePage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/overview");
  }

  const user = await getCurrentUser(session);

  if (!user) {
    redirect("/login");
  }

  return <ProfileView user={user} />;
}
