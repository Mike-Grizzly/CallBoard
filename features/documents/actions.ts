"use server";

import { db } from "@/db";
import { documents } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type UploadDocumentResult = {
  error?: string;
  success?: boolean;
};

export const DOCUMENT_TYPES = [
  { value: "script", label: "Script" },
  { value: "schedule", label: "Schedule" },
  { value: "design", label: "Design / Tech" },
  { value: "music", label: "Music / Score" },
  { value: "reference", label: "Reference" },
  { value: "general", label: "General" },
] as const;

export async function uploadDocument(
  formData: FormData,
): Promise<UploadDocumentResult> {
  const user = await requireCurrentUser();

  if (!can(user.role, "documents:upload")) {
    return { error: "You don't have permission to upload documents." };
  }

  const productionId = formData.get("production_id") as string;
  const title = (formData.get("title") as string)?.trim();
  const documentType = (formData.get("document_type") as string) || "general";
  const file = formData.get("file") as File;

  if (!productionId || !file || file.size === 0) {
    return { error: "Please select a file to upload." };
  }

  if (!title) {
    return { error: "Title is required." };
  }

  if (file.size > 25 * 1024 * 1024) {
    return { error: "File size must be under 25MB." };
  }

  const supabase = await createSupabaseServerClient();
  const storagePath = `documents/${productionId}/${Date.now()}-${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from("attachments")
    .upload(storagePath, file);

  if (uploadError) {
    return { error: `Upload failed: ${uploadError.message}` };
  }

  await db.insert(documents).values({
    productionId,
    uploadedBy: user.id,
    title,
    fileName: file.name,
    fileSize: file.size,
    contentType: file.type,
    storagePath,
    documentType,
  });

  revalidatePath("/productions");
  return { success: true };
}

export async function deleteDocument(
  formData: FormData,
): Promise<UploadDocumentResult> {
  const user = await requireCurrentUser();

  if (!can(user.role, "documents:upload")) {
    return { error: "You don't have permission to delete documents." };
  }

  const documentId = formData.get("document_id") as string;

  if (!documentId) {
    return { error: "Missing document ID." };
  }

  const doc = await db
    .select()
    .from(documents)
    .where(eq(documents.id, documentId))
    .limit(1);

  if (doc.length === 0) {
    return { error: "Document not found." };
  }

  const supabase = await createSupabaseServerClient();
  await supabase.storage.from("attachments").remove([doc[0].storagePath]);

  await db.delete(documents).where(eq(documents.id, documentId));

  revalidatePath("/productions");
  return { success: true };
}

export async function getDocumentUrl(storagePath: string): Promise<string> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.storage
    .from("attachments")
    .createSignedUrl(storagePath, 3600);

  return data?.signedUrl ?? "";
}
