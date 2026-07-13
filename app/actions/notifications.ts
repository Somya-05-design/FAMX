"use server";

import { getServerSession } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getNotifications, markAsRead, markAllAsRead } from "@/lib/data/notifications";

export async function getNotificationsAction() {
  const session = await getServerSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  return await getNotifications(session);
}

export async function markAsReadAction(notificationId: string) {
  const session = await getServerSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const result = await markAsRead(session, notificationId);
  revalidatePath("/");
  return result;
}

export async function markAllAsReadAction() {
  const session = await getServerSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const result = await markAllAsRead(session);
  revalidatePath("/");
  return result;
}
