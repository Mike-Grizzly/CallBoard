"use server";

import { Resend } from "resend";
import { requireCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getReportById } from "./queries";
import { getProductionBySlug } from "@/features/productions/queries";
import { getOrCreateDefaultOrganization } from "@/lib/organization";
import { formatReportAsHtml } from "./email-html";
import { formatReportAsEmail } from "./email-format";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";

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

  const org = await getOrCreateDefaultOrganization();
  const production = await getProductionBySlug(org.id, slug);

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

  const subject = `${production.title} — ${reportLabel}`;
  const html = formatReportAsHtml(report, production.title, authorName);
  const text = formatReportAsEmail(report, production.title, authorName);

  const { error } = await resend.emails.send({
    from: FROM,
    to: recipientEmails,
    subject,
    html,
    text,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}
