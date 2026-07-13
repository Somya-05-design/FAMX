import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/data/users";
import { SettingsForm } from "@/components/SettingsForm";

export default async function ClientSettingsPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  const user = await getCurrentUser(session);

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-100 font-sans">Account Settings</h1>
        <p className="text-sm text-zinc-400 mt-1">Manage your user profile details, notifications, and invoicing methods.</p>
      </div>

      {/* Settings Form component wrapper */}
      <SettingsForm user={user} />
    </div>
  );
}
