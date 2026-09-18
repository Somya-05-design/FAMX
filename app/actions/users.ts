"use server";

import { getServerSession } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { updateProfile, updateAvatar } from "@/lib/data/users";

export async function updateProfileAction(name: string, emailNotificationsEnabled: boolean) {
  const session = await getServerSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  await updateProfile(session, name, emailNotificationsEnabled);

  revalidatePath("/settings");
  revalidatePath("/profile");
  revalidatePath("/admin/profile");
  revalidatePath("/overview");
  revalidatePath("/admin");

  return { success: true };
}

export async function uploadAvatarAction(formData: FormData) {
  const session = await getServerSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const file = formData.get("file") as File;
  if (!file) {
    throw new Error("No image file provided");
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("Uploaded file must be an image");
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Image file size must be less than 5MB");
  }

  let avatarUrl: string;

  try {
    const supabase = createAdminClient();
    const bucketName = "avatars";

    // Ensure 'avatars' bucket exists and is public
    const { data: buckets } = await supabase.storage.listBuckets();
    if (!buckets?.some((b) => b.name === bucketName)) {
      await supabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 10 * 1024 * 1024,
      });
    } else {
      await supabase.storage.updateBucket(bucketName, {
        public: true,
      });
    }

    const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `${session.user.id}/${Date.now()}_${cleanFileName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      throw uploadError;
    }

    // Try signed URL (1 year validity) first, fallback to public URL
    const { data: signedData } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(storagePath, 60 * 60 * 24 * 365);

    if (signedData?.signedUrl) {
      avatarUrl = signedData.signedUrl;
    } else {
      const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(storagePath);
      avatarUrl = publicUrlData.publicUrl;
    }
  } catch (err) {
    // Fallback to data URL if storage upload fails
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    avatarUrl = `data:${file.type};base64,${base64}`;
  }

  await updateAvatar(session, avatarUrl);

  revalidatePath("/settings");
  revalidatePath("/profile");
  revalidatePath("/admin/profile");
  revalidatePath("/overview");
  revalidatePath("/admin");

  return { success: true, avatarUrl };
}

export async function removeAvatarAction() {
  const session = await getServerSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  await updateAvatar(session, null);

  revalidatePath("/settings");
  revalidatePath("/profile");
  revalidatePath("/admin/profile");
  revalidatePath("/overview");
  revalidatePath("/admin");

  return { success: true };
}
