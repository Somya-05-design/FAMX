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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
            My Projects
          </h1>
          <p className="text-xs sm:text-sm font-medium text-zinc-500 mt-1">
            Manage and track the lifecycle of your active and past requests.
          </p>
        </div>
        <Link
          href="/projects/new"
          className="bg-black hover:bg-zinc-800 active:bg-zinc-900 text-white font-bold px-6 py-2.5 rounded-xl text-sm shadow-xs transition-all cursor-pointer shrink-0"
        >
          New Project
        </Link>
      </div>

      {/* Filterable tabs & projects list */}
      <ProjectTabsList projects={projects} />
    </div>
  );
}
