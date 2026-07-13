import { prisma } from "../prisma";
import { Session } from "../types";
import { NotificationType } from "@prisma/client";

export async function getNotifications(session: Session) {
  return await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });
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

export async function createNotification(
  userId: string,
  type: NotificationType,
  projectId?: string
) {
  const notification = await prisma.notification.create({
    data: {
      userId,
      type,
      projectId: projectId || null,
      read: false,
    },
  });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user && user.emailNotificationsEnabled) {
    console.log(`[EMAIL SEND OUT] To: ${user.email} | Type: ${type} | Project ID: ${projectId || "N/A"}`);
  }

  return notification;
}
