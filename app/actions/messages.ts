"use server";

import { getServerSession } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getMessagesForProject, postMessage } from "@/lib/data/messages";

export async function getMessagesAction(projectId: string) {
  const session = await getServerSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  return await getMessagesForProject(session, projectId);
}

export async function sendMessageAction(projectId: string, body?: string, attachmentId?: string) {
  const session = await getServerSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const message = await postMessage(session, projectId, body, attachmentId);

  // Revalidate views
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/admin/projects/${projectId}`);

  return message;
}
