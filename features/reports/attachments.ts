"use server";

import { db } from "@/db";
import { reportAttachments, rehearsalReports } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireCurrentUser, userCanAccessProduction } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type UploadResult = {
  error?: string;
  success?: boolean;
};

export async function uploadReportAttachment(
  formData: FormData,
): Promise<UploadResult> {
  const user = await requireCurrentUser();

  if (!can(user.role, "reports:create")) {
    return { error: "You don't have permission to upload attachments." };
  }

  const reportId = formData.get("report_id") as string;
  const file = formData.get("file") as File;

  if (!reportId || !file || file.size === 0) {
    return { error: "Missing file or report." };
  }

  if (file.size > 10 * 1024 * 1024) {
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
  if (!allowedTypes.includes(file.type)) {
    return {
      error: "Unsupported file type. Upload a PDF, image, or Office document.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `reports/${reportId}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from("attachments")
    .upload(storagePath, file);

  if (uploadError) {
    return { error: `Upload failed: ${uploadError.message}` };
  }

  await db.insert(reportAttachments).values({
    reportId,
    uploadedBy: user.id,
    fileName: file.name,
    fileSize: file.size,
    contentType: file.type,
    storagePath,
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

  const supabase = await createSupabaseServerClient();
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
