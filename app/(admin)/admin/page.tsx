import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/supabase/server";
import { getProjectsForUser } from "@/lib/data/projects";
import { AdminProjectsList } from "@/components/AdminProjectsList";

export default async function AdminProjectsPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  const projects = await getProjectsForUser(session);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">All Project Requests</h1>
        <p className="text-sm text-zinc-400 mt-1">Review incoming design briefs, set quotes, request payments, and manage project lifecycles.</p>
      </div>

      {/* Admin project list table */}
      <AdminProjectsList projects={projects} />
    </div>
  );
}
