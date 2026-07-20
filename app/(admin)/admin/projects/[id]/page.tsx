import { notFound, redirect } from "next/navigation";
import { getServerSession } from "@/lib/supabase/server";
import { getProjectById } from "@/lib/data/projects";
import { AdminProjectDetailView } from "@/components/AdminProjectDetailView";

export default async function AdminProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  const project = await getProjectById(session, id);

  if (!project) {
    notFound();
  }

  return (
    <AdminProjectDetailView
      project={project as any}
      currentUserId={session.user.id}
    />
  );
}
