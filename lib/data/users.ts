import { prisma } from "../prisma";
import { Session } from "../types";

export async function getCurrentUser(session: Session) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });
    if (user) return user;
  } catch {
    // Fallback if generated Prisma client is out of sync with schema
  }
  const users: any[] = await prisma.$queryRaw`SELECT id, email, name, role, "emailNotificationsEnabled", "avatarUrl", "createdAt", "updatedAt" FROM "User" WHERE id = ${session.user.id}`;
  return users[0] || null;
}

export async function updateNotificationSettings(session: Session, enabled: boolean) {
  try {
    return await prisma.user.update({
      where: { id: session.user.id },
      data: { emailNotificationsEnabled: enabled },
    });
  } catch {
    await prisma.$executeRaw`UPDATE "User" SET "emailNotificationsEnabled" = ${enabled}, "updatedAt" = NOW() WHERE "id" = ${session.user.id}`;
    return getCurrentUser(session);
  }
}

export async function updateProfile(
  session: Session,
  name: string,
  emailNotificationsEnabled: boolean,
  avatarUrl?: string | null
) {
  try {
    return await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name,
        emailNotificationsEnabled,
        ...(avatarUrl !== undefined ? { avatarUrl } : {}),
      },
    });
  } catch {
    if (avatarUrl !== undefined) {
      await prisma.$executeRaw`UPDATE "User" SET "name" = ${name}, "emailNotificationsEnabled" = ${emailNotificationsEnabled}, "avatarUrl" = ${avatarUrl}, "updatedAt" = NOW() WHERE "id" = ${session.user.id}`;
    } else {
      await prisma.$executeRaw`UPDATE "User" SET "name" = ${name}, "emailNotificationsEnabled" = ${emailNotificationsEnabled}, "updatedAt" = NOW() WHERE "id" = ${session.user.id}`;
    }
    return getCurrentUser(session);
  }
}

export async function updateAvatar(session: Session, avatarUrl: string | null) {
  try {
    return await prisma.user.update({
      where: { id: session.user.id },
      data: { avatarUrl },
    });
  } catch {
    await prisma.$executeRaw`UPDATE "User" SET "avatarUrl" = ${avatarUrl}, "updatedAt" = NOW() WHERE "id" = ${session.user.id}`;
    return getCurrentUser(session);
  }
}
