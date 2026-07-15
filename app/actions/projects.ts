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

  // Trigger NEW_PROJECT_SUBMITTED notification to Admin(s)
  try {
    const { createNotification } = await import("@/lib/data/notifications");
    const admins = await prisma.user.findMany({ where: { role: "ADMIN" } });
    for (const admin of admins) {
      await createNotification(
        admin.id,
        "NEW_PROJECT_SUBMITTED",
        project.id
      );
    }
  } catch (err) {
    console.error("Failed to trigger project submitted notification", err);
  }

  revalidatePath("/overview");
  revalidatePath("/projects");
  return { id: project.id };
}

export async function updateProjectStatusAction(
  projectId: string,
  newStatus: ProjectStatus,
  opts?: { quoteAmount?: number; expectedUpdatedAt?: Date | string }
) {
  const session = await getServerSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const updated = await projectData.updateProjectStatus(session, projectId, newStatus, opts);
  
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

  // Trigger PROJECT_QUOTED notification to Client
  try {
    const { createNotification } = await import("@/lib/data/notifications");
    await createNotification(
      updated.clientId,
      "QUOTE_RECEIVED",
      updated.id
    );
  } catch (err) {
    console.error("Failed to trigger project quoted notification", err);
  }

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
