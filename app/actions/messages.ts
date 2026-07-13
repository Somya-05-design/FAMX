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

  // Trigger NEW_MESSAGE notification to client or admins
  try {
    const { createNotification } = await import("@/lib/data/notifications");
    const { prisma } = await import("@/lib/prisma");
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (project) {
      if (message.sender.role === "ADMIN") {
        await createNotification(
          project.clientId,
          "NEW_MESSAGE",
          project.id
        );
      } else {
        const admins = await prisma.user.findMany({ where: { role: "ADMIN" } });
        for (const admin of admins) {
          await createNotification(
            admin.id,
            "NEW_MESSAGE",
            project.id
          );
        }
      }
    }
  } catch (err) {
    console.error("Failed to trigger message notification", err);
  }

  // Revalidate views
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/admin/projects/${projectId}`);

  return message;
}
