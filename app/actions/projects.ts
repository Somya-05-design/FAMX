"use server";

import { getServerSession } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import * as projectData from "@/lib/data/projects";
import { ProjectStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function createProjectAction(input: projectData.CreateProjectInput) {
  const session = await getServerSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const project = await projectData.createProject(session, input);

  // TODO: Trigger NEW_PROJECT_SUBMITTED notification to Admin(s) (Phase 5)

  revalidatePath("/overview");
  revalidatePath("/projects");
  return { id: project.id };
}

export async function updateProjectStatusAction(projectId: string, newStatus: ProjectStatus) {
  const session = await getServerSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const updated = await projectData.updateProjectStatus(session, projectId, newStatus);
  
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath("/projects");
  revalidatePath("/admin");
  revalidatePath("/overview");

  return { status: updated.status };
}

export async function updateQuoteAmountAction(projectId: string, quoteAmount: number) {
  const session = await getServerSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const updated = await projectData.updateQuoteAmount(session, projectId, quoteAmount);

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath("/projects");
  revalidatePath("/admin");

  return { quoteAmount: updated.quoteAmount?.toNumber() };
}

export async function toggleDisputeAction(projectId: string, isDisputed: boolean) {
  const session = await getServerSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const updated = await projectData.toggleDispute(session, projectId, isDisputed);

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/admin/projects/${projectId}`);

  return { isDisputed: updated.isDisputed };
}
