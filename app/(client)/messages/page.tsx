import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/supabase/server";
import { getNotifications } from "@/lib/data/notifications";
import { ClientMessagesView } from "@/components/ClientMessagesView";

export default async function ClientMessagesPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  const notifications = await getNotifications(session);

  return (
    <div className="animate-fadeIn">
      <ClientMessagesView initialNotifications={notifications as any} userId={session.user.id} />
    </div>
  );
}
