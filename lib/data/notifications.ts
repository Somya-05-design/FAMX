import { prisma } from "../prisma";
import { Session } from "../types";
import { NotificationType } from "@prisma/client";

export function buildNotificationMessage(type: NotificationType, projectTitle: string): string {
  switch (type) {
    case "NEW_PROJECT_SUBMITTED":
      return `New project request submitted: "${projectTitle}"`;
    case "QUOTE_RECEIVED":
      return `A quote has been issued for "${projectTitle}"`;
    case "PAYMENT_REQUESTED":
      return `New payment requested for "${projectTitle}"`;
    case "PAYMENT_SUCCEEDED":
      return `Payment succeeded for "${projectTitle}"`;
    case "PAYMENT_REJECTED":
      return `Payment proof rejected for "${projectTitle}"`;
    case "PAYMENT_VERIFICATION_REQUESTED":
      return `Payment proof submitted for verification on "${projectTitle}"`;
    case "PROJECT_STATUS_CHANGED":
      return `Status updated on "${projectTitle}"`;
    case "BUDGET_COUNTER_OFFER":
      return `New budget counter-offer on "${projectTitle}"`;
    case "NEW_MESSAGE":
      return `New message on "${projectTitle}"`;
    default:
      return `Notification update on "${projectTitle}"`;
  }
}

export async function getNotifications(session: Session) {
  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      project: {
        select: { title: true },
      },
    },
  });

  return notifications.map((n) => ({
    ...n,
    message: n.message || (n.project?.title ? buildNotificationMessage(n.type, n.project.title) : "Notification update on project"),
  }));
}

export async function markAsRead(session: Session, notificationId: string) {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });

  if (!notification || notification.userId !== session.user.id) {
    throw new Error("Unauthorized to modify this notification");
  }

  return await prisma.notification.update({
    where: { id: notificationId },
    data: { read: true },
  });
}

export async function markAllAsRead(session: Session) {
  return await prisma.notification.updateMany({
    where: {
      userId: session.user.id,
      read: false,
    },
    data: { read: true },
  });
}

export async function deleteNotification(session: Session, notificationId: string) {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });

  if (!notification || notification.userId !== session.user.id) {
    throw new Error("Unauthorized to delete this notification");
  }

  return await prisma.notification.delete({
    where: { id: notificationId },
  });
}

export async function getProjectParticipants(
  projectIdOrProject: string | { id: string; clientId: string }
): Promise<string[]> {
  let clientId: string;
  if (typeof projectIdOrProject === "string") {
    const project = await prisma.project.findUnique({
      where: { id: projectIdOrProject },
      select: { clientId: true },
    });
    if (!project) return [];
    clientId = project.clientId;
  } else {
    clientId = projectIdOrProject.clientId;
  }

  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true },
  });

  const allIds = [clientId, ...admins.map((a) => a.id)];
  return Array.from(new Set(allIds));
}

export async function getNotificationRecipients(
  projectIdOrProject: string | { id: string; clientId: string },
  actorUserId: string
): Promise<string[]> {
  const participants = await getProjectParticipants(projectIdOrProject);
  return participants.filter((id) => id !== actorUserId);
}

export interface CreateNotificationParams {
  projectId: string;
  type: NotificationType;
  actorUserId: string;
  message?: string;
}

export async function createNotification(
  paramsOrActor: CreateNotificationParams | string,
  typeArg?: NotificationType,
  projectIdArg?: string
) {
  let actorUserId: string;
  let type: NotificationType;
  let projectId: string | undefined;
  let customMessage: string | undefined;

  if (typeof paramsOrActor === "object") {
    actorUserId = paramsOrActor.actorUserId;
    type = paramsOrActor.type;
    projectId = paramsOrActor.projectId;
    customMessage = paramsOrActor.message;
  } else {
    actorUserId = paramsOrActor;
    type = typeArg!;
    projectId = projectIdArg;
  }

  if (!actorUserId) {
    throw new Error("actorUserId is required when creating a notification");
  }

  if (!projectId) {
    throw new Error("projectId is required when creating a notification");
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { title: true },
  });

  const messageText = customMessage || buildNotificationMessage(type, project?.title || "Project");
  const recipientUserIds = await getNotificationRecipients(projectId, actorUserId);

  const notifications = await Promise.all(
    recipientUserIds.map(async (userId) => {
      const notification = await prisma.notification.create({
        data: {
          userId,
          type,
          projectId,
          message: messageText,
          read: false,
        },
      });

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, emailNotificationsEnabled: true },
      });
      if (user && user.emailNotificationsEnabled) {
        console.log(`[EMAIL SEND OUT] To: ${user.email} | Type: ${type} | Project ID: ${projectId} | Message: ${messageText}`);
      }

      return notification;
    })
  );

  return notifications;
}


