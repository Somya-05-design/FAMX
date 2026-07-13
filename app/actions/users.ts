"use server";

import { getServerSession } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { updateProfile } from "@/lib/data/users";

export async function updateProfileAction(name: string, emailNotificationsEnabled: boolean) {
  const session = await getServerSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  await updateProfile(session, name, emailNotificationsEnabled);

  revalidatePath("/settings");
  revalidatePath("/overview");

  return { success: true };
}
