import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/supabase/server";
import { getProjectsForUser } from "@/lib/data/projects";
import { getNotifications } from "@/lib/data/notifications";
import { KanbanBoard } from "@/components/KanbanBoard";

export default async function AdminProjectsPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  // Fetch projects and notifications in parallel
  const [projects, notifications] = await Promise.all([
    getProjectsForUser(session),
    getNotifications(session),
  ]);

  return (
    <div className="animate-fadeIn">
      {/* Admin project Kanban board */}
      <KanbanBoard
        initialProjects={projects as any}
        initialNotifications={notifications as any}
        userId={session.user.id}
      />
    </div>
  );
}
