"use server";

import { db } from "@/db";
import { documents, documentFolders, documentComments, notifications, profiles, productions } from "@/db/schema";
import { eq, and, isNotNull, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireCurrentUser, userCanAccessProduction } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DEFAULT_FOLDERS } from "./constants";

export type UploadDocumentResult = {
  error?: string;
  success?: boolean;
};

export async function createDefaultFolders(productionId: string) {
  await db.insert(documentFolders).values(
    DEFAULT_FOLDERS.map((name, i) => ({
      productionId,
      name,
      sortOrder: i,
    })),
  );
}

export type CreateFolderResult = { error?: string; success?: boolean };

export async function createFolder(
  formData: FormData,
): Promise<CreateFolderResult> {
  const user = await requireCurrentUser();

  if (!can(user.role, "documents:upload")) {
    return { error: "You don't have permission to create folders." };
  }

  const productionId = formData.get("production_id") as string;
  const name = (formData.get("name") as string)?.trim();

  if (!productionId || !name) {
    return { error: "Folder name is required." };
  }

  if (name.length > 50) {
    return { error: "Folder name must be 50 characters or less." };
  }

  if (!(await userCanAccessProduction(user, productionId))) {
    return { error: "You don't have access to this production." };
  }

  const existing = await db
    .select({ id: documentFolders.id })
    .from(documentFolders)
    .where(eq(documentFolders.productionId, productionId));

  await db.insert(documentFolders).values({
    productionId,
    name,
    sortOrder: existing.length,
  });

  revalidatePath("/productions");
  return { success: true };
}

export async function requestDocumentUpload(
  productionId: string,
  fileName: string,
  contentType: string,
  fileSize: number,
): Promise<{ error?: string; path?: string; token?: string }> {
  const user = await requireCurrentUser();

  if (!can(user.role, "documents:upload")) {
    return { error: "You don't have permission to upload documents." };
  }

  if (!productionId) return { error: "Missing production." };
  if (!(await userCanAccessProduction(user, productionId))) {
    return { error: "You don't have access to this production." };
  }
  if (!fileName || fileSize <= 0) {
    return { error: "Please select a file to upload." };
  }
  if (fileSize > 25 * 1024 * 1024) {
    return { error: "File size must be under 25MB." };
  }

  const allowedTypes = [
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/gif",
    "image/webp",
    "text/plain",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ];
  if (!allowedTypes.includes(contentType)) {
    return {
      error: "Unsupported file type. Upload a PDF, image, or Office document.",
    };
  }

  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `documents/${productionId}/${Date.now()}-${safeName}`;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.storage
    .from("attachments")
    .createSignedUploadUrl(storagePath);

  if (error || !data) {
    return {
      error: `Could not start upload: ${error?.message ?? "unknown error"}`,
    };
  }

  return { path: data.path, token: data.token };
}

export async function finalizeDocumentUpload(input: {
  productionId: string;
  storagePath: string;
  title: string;
  folderId: string | null;
  documentType: string;
  fileName: string;
  fileSize: number;
  contentType: string;
}): Promise<UploadDocumentResult> {
  const user = await requireCurrentUser();

  if (!can(user.role, "documents:upload")) {
    return { error: "You don't have permission to upload documents." };
  }

  const title = input.title?.trim();
  if (!title) return { error: "Title is required." };
  if (!input.productionId || !input.storagePath) {
    return { error: "Upload could not be completed." };
  }

  if (!(await userCanAccessProduction(user, input.productionId))) {
    return { error: "You don't have access to this production." };
  }

  // The storage path was generated server-side under the production's
  // prefix; reject anything else so a caller cannot attach an arbitrary
  // stored object to a production.
  if (!input.storagePath.startsWith(`documents/${input.productionId}/`)) {
    return { error: "Upload could not be verified." };
  }

  await db.insert(documents).values({
    productionId: input.productionId,
    uploadedBy: user.id,
    folderId: input.folderId || undefined,
    title,
    fileName: input.fileName,
    fileSize: input.fileSize,
    contentType: input.contentType,
    storagePath: input.storagePath,
    documentType: input.documentType || "general",
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
  if (!documentId) return { error: "Missing document ID." };

  if (!(await resolveAccessibleDocument(documentId))) {
    return { error: "Document not found." };
  }

  await db
    .update(documents)
    .set({ deletedAt: new Date() })
    .where(eq(documents.id, documentId));

  revalidatePath("/productions");
  return { success: true };
}

export async function restoreDocument(
  formData: FormData,
): Promise<UploadDocumentResult> {
  const user = await requireCurrentUser();

  if (!can(user.role, "documents:upload")) {
    return { error: "You don't have permission to restore documents." };
  }

  const documentId = formData.get("document_id") as string;
  if (!documentId) return { error: "Missing document ID." };

  if (!(await resolveAccessibleDocument(documentId))) {
    return { error: "Document not found." };
  }

  await db
    .update(documents)
    .set({ deletedAt: null })
    .where(eq(documents.id, documentId));

  revalidatePath("/productions");
  return { success: true };
}

export async function permanentlyDeleteDocument(
  formData: FormData,
): Promise<UploadDocumentResult> {
  const user = await requireCurrentUser();

  if (!can(user.role, "documents:upload")) {
    return { error: "You don't have permission to permanently delete documents." };
  }

  const documentId = formData.get("document_id") as string;
  if (!documentId) return { error: "Missing document ID." };

  const doc = await resolveAccessibleDocument(documentId);
  if (!doc) return { error: "Document not found." };

  const supabase = await createSupabaseServerClient();
  await supabase.storage.from("attachments").remove([doc.storagePath]);
  await db.delete(documents).where(eq(documents.id, documentId));

  revalidatePath("/productions");
  return { success: true };
}

export async function fetchDocumentComments(documentId: string) {
  await requireCurrentUser();
  const { getDocumentComments } = await import("./queries");
  return getDocumentComments(documentId);
}

export type PostCommentResult = { error?: string; success?: boolean };

export async function postComment(
  formData: FormData,
): Promise<PostCommentResult> {
  const user = await requireCurrentUser();

  const documentId = formData.get("document_id") as string;
  const body = (formData.get("body") as string)?.trim();

  if (!documentId || !body) {
    return { error: "Comment body is required." };
  }

  if (body.length > 2000) {
    return { error: "Comment must be 2000 characters or less." };
  }

  // Verify document exists and get production slug for notification link
  const doc = await db
    .select({ id: documents.id, title: documents.title, slug: productions.slug })
    .from(documents)
    .innerJoin(productions, eq(documents.productionId, productions.id))
    .where(eq(documents.id, documentId))
    .limit(1);

  if (doc.length === 0) {
    return { error: "Document not found." };
  }

  await db.insert(documentComments).values({
    documentId,
    authorId: user.id,
    body,
  });

  // Parse @{First Last} mentions and create notifications
  const mentionRegex = /@\{([^}]+)\}/g;
  const mentionedNames = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = mentionRegex.exec(body)) !== null) {
    mentionedNames.add(match[1].trim());
  }

  if (mentionedNames.size > 0) {
    const authorName =
      `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email;

    // Find profiles by full name match
    const allMentioned = await db
      .select({ id: profiles.id, firstName: profiles.firstName, lastName: profiles.lastName })
      .from(profiles);

    const recipientIds = allMentioned
      .filter((p) => {
        const full = `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim();
        return mentionedNames.has(full) && p.id !== user.id;
      })
      .map((p) => p.id);

    if (recipientIds.length > 0) {
      await db.insert(notifications).values(
        recipientIds.map((recipientId) => ({
          recipientId,
          type: "mention",
          title: `${authorName} mentioned you`,
          body: `In a comment on "${doc[0].title}"`,
          link: `/productions/${doc[0].slug}/documents?doc=${documentId}`,
        })),
      );
    }
  }

  revalidatePath("/productions");
  return { success: true };
}

async function resolveAccessibleDocument(documentId: string) {
  const user = await requireCurrentUser();

  const [doc] = await db
    .select({
      storagePath: documents.storagePath,
      productionId: documents.productionId,
    })
    .from(documents)
    .where(eq(documents.id, documentId))
    .limit(1);

  if (!doc) return null;
  if (!(await userCanAccessProduction(user, doc.productionId))) return null;

  return doc;
}

export async function getDocumentUrl(documentId: string): Promise<string> {
  const doc = await resolveAccessibleDocument(documentId);
  if (!doc) return "";

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.storage
    .from("attachments")
    .createSignedUrl(doc.storagePath, 3600);

  return data?.signedUrl ?? "";
}

export async function getDocumentDownloadUrl(
  documentId: string,
  fileName: string,
): Promise<string> {
  const doc = await resolveAccessibleDocument(documentId);
  if (!doc) return "";

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.storage
    .from("attachments")
    .createSignedUrl(doc.storagePath, 3600, { download: fileName });

  return data?.signedUrl ?? "";
}

export type MoveDocumentResult = { error?: string; success?: boolean };

export async function moveDocument(
  formData: FormData,
): Promise<MoveDocumentResult> {
  const user = await requireCurrentUser();

  if (!can(user.role, "documents:upload")) {
    return { error: "You don't have permission to move documents." };
  }

  const documentId = formData.get("document_id") as string;
  const folderId = (formData.get("folder_id") as string) || null;

  if (!documentId) {
    return { error: "Missing document ID." };
  }

  await db
    .update(documents)
    .set({ folderId })
    .where(eq(documents.id, documentId));

  revalidatePath("/productions");
  return { success: true };
}

export async function fetchDeletedDocumentsByProduction(productionId: string) {
  await requireCurrentUser();
  return db
    .select({
      id: documents.id,
      title: documents.title,
      fileName: documents.fileName,
      fileSize: documents.fileSize,
      contentType: documents.contentType,
      storagePath: documents.storagePath,
      folderName: documentFolders.name,
      deletedAt: documents.deletedAt,
    })
    .from(documents)
    .leftJoin(documentFolders, eq(documents.folderId, documentFolders.id))
    .where(and(eq(documents.productionId, productionId), isNotNull(documents.deletedAt)))
    .orderBy(desc(documents.deletedAt));
}
