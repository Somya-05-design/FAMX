import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/supabase/server";
import { getProjectsForUser } from "@/lib/data/projects";
import { ProjectTabsList } from "@/components/ProjectTabsList";
import Link from "next/link";

export default async function ClientProjectsPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  const projects = await getProjectsForUser(session);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header bar */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">My Projects</h1>
          <p className="text-sm text-zinc-400 mt-1">Manage and track the lifecycle of your active and past requests.</p>
        </div>
        <Link
          href="/projects/new"
          className="bg-violet-600 hover:bg-violet-500 text-white font-semibold px-4 py-2.5 rounded-xl text-xs transition-all shadow-md shadow-indigo-950/20"
        >
          New Request
        </Link>
      </div>

      {/* Filterable tabs & projects list */}
      <ProjectTabsList projects={projects} />
    </div>
  );
}
