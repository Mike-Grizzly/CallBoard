"use server";

import { db } from "@/db";
import { reportAttachments, rehearsalReports } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireCurrentUser, userCanAccessProduction } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { assertCanMutate } from "@/features/billing/guard";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export type UploadResult = {
  error?: string;
  success?: boolean;
};

export async function requestReportAttachmentUpload(
  reportId: string,
  fileName: string,
  contentType: string,
  fileSize: number,
): Promise<{ error?: string; path?: string; token?: string }> {
  const user = await requireCurrentUser();

  if (!can(user.role, "reports:create")) {
    return { error: "You don't have permission to upload attachments." };
  }

  const lock = await assertCanMutate(user.organizationId);
  if (lock.error) return { error: lock.error };

  if (!reportId) return { error: "Missing report." };
  if (!fileName || fileSize <= 0) return { error: "Please select a file." };
  if (fileSize > 10 * 1024 * 1024) {
    return { error: "File size must be under 10MB." };
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
  const storagePath = `reports/${reportId}/${Date.now()}-${safeName}`;

  const supabase = createSupabaseAdminClient();
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

export async function finalizeReportAttachmentUpload(input: {
  reportId: string;
  storagePath: string;
  fileName: string;
  fileSize: number;
  contentType: string;
}): Promise<UploadResult> {
  const user = await requireCurrentUser();

  if (!can(user.role, "reports:create")) {
    return { error: "You don't have permission to upload attachments." };
  }

  if (!input.reportId || !input.storagePath) {
    return { error: "Upload could not be completed." };
  }
  if (!input.storagePath.startsWith(`reports/${input.reportId}/`)) {
    return { error: "Upload could not be verified." };
  }

  await db.insert(reportAttachments).values({
    reportId: input.reportId,
    uploadedBy: user.id,
    fileName: input.fileName,
    fileSize: input.fileSize,
    contentType: input.contentType,
    storagePath: input.storagePath,
  });

  revalidatePath("/productions");
  return { success: true };
}

export async function getAttachmentUrl(attachmentId: string): Promise<string> {
  const user = await requireCurrentUser();

  const [row] = await db
    .select({
      storagePath: reportAttachments.storagePath,
      productionId: rehearsalReports.productionId,
    })
    .from(reportAttachments)
    .innerJoin(
      rehearsalReports,
      eq(reportAttachments.reportId, rehearsalReports.id),
    )
    .where(eq(reportAttachments.id, attachmentId))
    .limit(1);

  if (!row) return "";
  if (!(await userCanAccessProduction(user, row.productionId))) return "";

  const supabase = createSupabaseAdminClient();
  const { data } = await supabase.storage
    .from("attachments")
    .createSignedUrl(row.storagePath, 3600);

  return data?.signedUrl ?? "";
}

export async function getReportAttachments(reportId: string) {
  await requireCurrentUser();
  return db
    .select()
    .from(reportAttachments)
    .where(eq(reportAttachments.reportId, reportId));
}

export async function deleteReportAttachment(
  attachmentId: string,
): Promise<UploadResult> {
  const user = await requireCurrentUser();

  if (!can(user.role, "reports:create")) {
    return { error: "You don't have permission to remove attachments." };
  }

  const [row] = await db
    .select({
      storagePath: reportAttachments.storagePath,
      productionId: rehearsalReports.productionId,
    })
    .from(reportAttachments)
    .innerJoin(
      rehearsalReports,
      eq(reportAttachments.reportId, rehearsalReports.id),
    )
    .where(eq(reportAttachments.id, attachmentId))
    .limit(1);

  if (!row) return { error: "Attachment not found." };
  if (!(await userCanAccessProduction(user, row.productionId))) {
    return { error: "You don't have access to this report." };
  }

  const supabase = createSupabaseAdminClient();
  // Best-effort storage cleanup — DB delete is the source of truth.
  await supabase.storage.from("attachments").remove([row.storagePath]);

  await db
    .delete(reportAttachments)
    .where(eq(reportAttachments.id, attachmentId));

  revalidatePath("/productions");
  return { success: true };
}
