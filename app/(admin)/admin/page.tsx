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
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">All Projects Board</h1>
        <p className="text-sm text-zinc-400 mt-1">Review incoming design briefs, set quotes, request payments, and manage project lifecycles on a single Kanban board.</p>
      </div>

      {/* Admin project Kanban board */}
      <KanbanBoard
        initialProjects={projects as any}
        initialNotifications={notifications as any}
        userId={session.user.id}
      />
    </div>
  );
}
