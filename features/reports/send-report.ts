"use server";

import { Resend } from "resend";
import { requireCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getReportById } from "./queries";
import { getReportAttachments } from "./attachments";
import {
  getProductionBySlug,
  getResolvedDepartments,
} from "@/features/productions/queries";
import { formatReportAsHtml, type EmailAttachmentMeta } from "./email-html";
import { formatReportAsEmail } from "./email-format";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";

// Resend rejects emails whose total attachment payload exceeds 40 MB.
// Stay well under to leave headroom for the email body itself.
const TOTAL_ATTACHMENT_BUDGET_BYTES = 35 * 1024 * 1024;

export type SendReportResult = {
  success?: boolean;
  error?: string;
};

export async function sendReport(
  reportId: string,
  slug: string,
  recipientEmails: string[],
): Promise<SendReportResult> {
  const user = await requireCurrentUser();

  if (!can(user.role, "reports:create")) {
    return { error: "You don't have permission to send reports." };
  }

  if (recipientEmails.length === 0) {
    return { error: "No recipients selected." };
  }

  const production = await getProductionBySlug(user.organizationId, slug);

  if (!production) {
    return { error: "Production not found." };
  }

  const report = await getReportById(reportId);

  if (!report || report.productionId !== production.id) {
    return { error: "Report not found." };
  }

  const authorName =
    report.createdByFirstName || report.createdByLastName
      ? `${report.createdByFirstName} ${report.createdByLastName}`.trim()
      : report.createdByEmail;

  const reportLabel = report.reportNumber
    ? `Rehearsal Report #${report.reportNumber}`
    : "Rehearsal Report";

  // Pull attachments and fetch their bytes from Storage so Resend can
  // attach them inline. Drop anything that pushes us over the budget so
  // the email still goes through with a partial attachment list.
  const attachmentRows = await getReportAttachments(reportId);
  const supabase = createSupabaseAdminClient();

  const resendAttachments: { filename: string; content: Buffer }[] = [];
  const includedMeta: EmailAttachmentMeta[] = [];
  const skipped: EmailAttachmentMeta[] = [];
  let totalBytes = 0;

  for (const row of attachmentRows) {
    if (totalBytes + row.fileSize > TOTAL_ATTACHMENT_BUDGET_BYTES) {
      skipped.push({ fileName: row.fileName, fileSize: row.fileSize });
      continue;
    }
    const { data, error } = await supabase.storage
      .from("attachments")
      .download(row.storagePath);
    if (error || !data) {
      skipped.push({ fileName: row.fileName, fileSize: row.fileSize });
      continue;
    }
    const buf = Buffer.from(await data.arrayBuffer());
    resendAttachments.push({ filename: row.fileName, content: buf });
    includedMeta.push({ fileName: row.fileName, fileSize: row.fileSize });
    totalBytes += row.fileSize;
  }

  const departments = await getResolvedDepartments(report.productionId);
  const subject = `${production.title} — ${reportLabel}`;
  const html = formatReportAsHtml(report, production.title, authorName, includedMeta, departments);
  const text = formatReportAsEmail(report, production.title, authorName, includedMeta, departments);

  const { error } = await resend.emails.send({
    from: FROM,
    to: recipientEmails,
    subject,
    html,
    text,
    attachments: resendAttachments.length > 0 ? resendAttachments : undefined,
  });

  if (error) {
    return { error: error.message };
  }

  if (skipped.length > 0) {
    // Surface a soft warning the UI can show even after success — the email
    // went out, but some attachments didn't fit.
    return {
      success: true,
      error: `Sent, but ${skipped.length} attachment${skipped.length === 1 ? "" : "s"} couldn't be included (too large): ${skipped.map((s) => s.fileName).join(", ")}`,
    };
  }

  return { success: true };
}
