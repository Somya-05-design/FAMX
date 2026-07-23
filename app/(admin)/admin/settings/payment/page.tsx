import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/supabase/server";
import { getAdminPaymentSettings } from "@/lib/data/payments";
import { AdminPaymentSettingsForm } from "@/components/AdminPaymentSettingsForm";
import Link from "next/link";

export default async function AdminPaymentSettingsPage() {
  const session = await getServerSession();

  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const settings = await getAdminPaymentSettings();

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fadeIn">
      <div className="flex items-center justify-between">
        <Link
          href="/admin"
          className="flex items-center space-x-2 text-xs font-semibold text-zinc-600 hover:text-zinc-900 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back to Admin Dashboard</span>
        </Link>
      </div>

      <AdminPaymentSettingsForm initialSettings={settings} />
    </div>
  );
}
