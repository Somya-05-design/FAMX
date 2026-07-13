import { prisma } from "../prisma";
import { Session } from "../types";

export async function getCurrentUser(session: Session) {
  return await prisma.user.findUnique({
    where: { id: session.user.id },
  });
}

export async function updateNotificationSettings(session: Session, enabled: boolean) {
  return await prisma.user.update({
    where: { id: session.user.id },
    data: { emailNotificationsEnabled: enabled },
  });
}

export async function updateProfile(
  session: Session,
  name: string,
  emailNotificationsEnabled: boolean
) {
  return await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name,
      emailNotificationsEnabled,
    },
  });
}
