"use server";

import { getServerSession } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { proposeBudget, finalizeBudget, getBudgetHistory } from "@/lib/data/budget";

export async function proposeBudgetAction(projectId: string, amount: number, note?: string) {
  const session = await getServerSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const project = await proposeBudget(session, projectId, amount, note);

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath("/projects");
  revalidatePath("/admin");

  return { id: project.id, status: project.status };
}

export async function finalizeBudgetAction(projectId: string, finalAmount: number) {
  const session = await getServerSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const project = await finalizeBudget(session, projectId, finalAmount);

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath("/projects");
  revalidatePath("/admin");

  return { id: project.id, status: project.status, isBudgetFinalized: project.isBudgetFinalized };
}

export async function getBudgetHistoryAction(projectId: string) {
  const session = await getServerSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  return await getBudgetHistory(session, projectId);
}
