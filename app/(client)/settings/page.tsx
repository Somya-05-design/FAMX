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
        <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">Account Settings</h1>
        <p className="text-xs sm:text-sm font-medium text-on-surface-variant mt-1">Manage your user profile details, notifications, and invoicing methods.</p>
      </div>

      {/* Settings Form component wrapper */}
      <SettingsForm user={user} />
    </div>
  );
}
