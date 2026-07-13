import { prisma } from "../prisma";
import { Session } from "../types";

export async function getMessagesForProject(session: Session, projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    throw new Error("Project not found");
  }

  // Authorization check
  if (session.user.role === "CLIENT" && project.clientId !== session.user.id) {
    throw new Error("Unauthorized access to project messages");
  }

  return await prisma.projectMessage.findMany({
    where: { projectId },
    orderBy: { createdAt: "asc" },
    include: {
      sender: {
        select: { id: true, name: true, email: true, role: true },
      },
      attachment: true,
    },
  });
}

export async function postMessage(
  session: Session,
  projectId: string,
  body?: string,
  attachmentId?: string
) {
  if (!body && !attachmentId) {
    throw new Error("Cannot send an empty message");
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    throw new Error("Project not found");
  }

  // Authorization check
  if (session.user.role === "CLIENT" && project.clientId !== session.user.id) {
    throw new Error("Unauthorized to post messages in this project");
  }

  return await prisma.projectMessage.create({
    data: {
      projectId,
      senderId: session.user.id,
      body: body || null,
      attachmentId: attachmentId || null,
    },
    include: {
      sender: {
        select: { id: true, name: true, email: true, role: true },
      },
      attachment: true,
    },
  });
}
