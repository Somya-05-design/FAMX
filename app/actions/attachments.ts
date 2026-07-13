"use server";

import { getServerSession } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function uploadAttachment(formData: FormData) {
  const session = await getServerSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const file = formData.get("file") as File;
  if (!file) {
    throw new Error("No file uploaded");
  }

  const supabase = createAdminClient();

  // Auto-initialize bucket if it doesn't exist
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) {
    throw new Error(`Failed to list storage buckets: ${listError.message}`);
  }

  const bucketName = "attachments";
  if (!buckets?.some((b) => b.name === bucketName)) {
    const { error: createError } = await supabase.storage.createBucket(bucketName, {
      public: false,
      fileSizeLimit: 10 * 1024 * 1024, // 10MB limit
    });
    if (createError) {
      throw new Error(`Failed to create storage bucket: ${createError.message}`);
    }
  }

  // Generate attachment metadata
  const attachmentId = crypto.randomUUID();
  const storagePath = `projects/temp/${attachmentId}/${file.name}`;

  // Convert File to Buffer for Supabase upload
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error: uploadError } = await supabase.storage
    .from(bucketName)
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  // Persist attachment entry in DB (initially unlinked to a project)
  const attachment = await prisma.attachment.create({
    data: {
      id: attachmentId,
      uploaderId: session.user.id,
      fileName: file.name,
      storagePath,
      mimeType: file.type,
      sizeBytes: file.size,
    },
  });

  return {
    id: attachment.id,
    fileName: attachment.fileName,
    sizeBytes: attachment.sizeBytes,
  };
}

// Generates a short-lived download URL for an attachment
export async function getDownloadUrl(attachmentId: string) {
  const session = await getServerSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const attachment = await prisma.attachment.findUnique({
    where: { id: attachmentId },
  });

  if (!attachment) {
    throw new Error("Attachment not found");
  }

  // Verify access permissions
  if (session.user.role === "CLIENT") {
    // Client can only download their own uploaded files or those attached to their projects
    if (attachment.uploaderId !== session.user.id) {
      if (attachment.projectId) {
        const project = await prisma.project.findUnique({
          where: { id: attachment.projectId },
        });
        if (project?.clientId !== session.user.id) {
          throw new Error("Unauthorized");
        }
      } else {
        throw new Error("Unauthorized");
      }
    }
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.storage
    .from("attachments")
    .createSignedUrl(attachment.storagePath, 60 * 5); // 5 minutes validity

  if (error) {
    throw new Error(`Failed to generate download URL: ${error.message}`);
  }

  return data.signedUrl;
}
