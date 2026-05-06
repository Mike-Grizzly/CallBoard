import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Paperclip } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { requireCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getOrCreateDefaultOrganization } from "@/lib/organization";
import { getProductionBySlug } from "@/features/productions/queries";
import {
  getProductionMembership,
  getProductionMembers,
} from "@/features/members/queries";
import { getReportById } from "@/features/reports/queries";
import { DEPARTMENTS } from "@/features/reports/constants";
import { formatReportAsEmail } from "@/features/reports/email-format";
import {
  getReportAttachments,
  getAttachmentUrl,
} from "@/features/reports/attachments";
import { AttachmentUpload } from "./attachment-upload";
import { CopyEmailButton } from "./copy-email-button";

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ slug: string; reportId: string }>;
}) {
  const { slug, reportId } = await params;
  const user = await requireCurrentUser();
  const org = await getOrCreateDefaultOrganization();
  const production = await getProductionBySlug(org.id, slug);

  if (!production) {
    notFound();
  }

  const canManage = can(user.role, "productions:manage");
  if (!canManage) {
    const membership = await getProductionMembership(user.id, production.id);
    if (!membership) {
      redirect("/productions");
    }
  }

  const report = await getReportById(reportId);

  if (!report || report.productionId !== production.id) {
    notFound();
  }

  const [attachments, productionMembers] = await Promise.all([
    getReportAttachments(reportId),
    getProductionMembers(production.id),
  ]);
  const canUpload = can(user.role, "reports:create");

  const attachmentUrls = await Promise.all(
    attachments.map(async (a) => ({
      ...a,
      url: await getAttachmentUrl(a.storagePath),
    })),
  );

  const authorName =
    report.createdByFirstName || report.createdByLastName
      ? `${report.createdByFirstName} ${report.createdByLastName}`.trim()
      : report.createdByEmail;

  const emailText = formatReportAsEmail(report, production.title, authorName);

  const headerTimeBits: string[] = [];
  if (report.scheduledCall) headerTimeBits.push(`Call ${report.scheduledCall}`);
  if (report.actualStart) headerTimeBits.push(`Start ${report.actualStart}`);
  if (report.endTime) headerTimeBits.push(`End ${report.endTime}`);

  const hasNext =
    report.nextRehearsalDate ||
    report.nextRehearsalTime ||
    report.nextRehearsalLocation ||
    report.nextRehearsalNotes;

  const reportTitle = report.reportNumber
    ? `Report #${report.reportNumber} — ${formatDate(report.reportDate)}`
    : `Rehearsal Report — ${formatDate(report.reportDate)}`;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <Link
          href={`/productions/${slug}/reports`}
          className="text-sm text-[color:var(--muted-foreground)] underline underline-offset-4 hover:text-[color:var(--foreground)]"
        >
          &larr; Back to reports
        </Link>
        <div className="mt-3 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {reportTitle}
            </h1>
            <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
              {production.title} · Filed by {authorName}
            </p>
            {headerTimeBits.length > 0 && (
              <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
                {headerTimeBits.join(" · ")}
              </p>
            )}
          </div>
          <CopyEmailButton text={emailText} members={productionMembers} />
        </div>
      </div>

      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[color:var(--muted-foreground)]">
              General Notes
            </h2>
            {report.generalNotes ? (
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: report.generalNotes }}
              />
            ) : (
              <p className="text-sm text-[color:var(--muted-foreground)]">
                None
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[color:var(--muted-foreground)]">
              Department Notes
            </h2>
            <dl className="divide-y divide-[color:var(--border)]">
              {DEPARTMENTS.map((dept) => {
                const value = report[dept.key] as string | null;
                const display = value && value.trim() ? value.trim() : "None";
                const isEmpty = !value || !value.trim();
                return (
                  <div
                    key={dept.key}
                    className="grid grid-cols-1 gap-1 py-2 md:grid-cols-[200px_1fr] md:gap-4"
                  >
                    <dt className="text-sm font-medium">{dept.label}</dt>
                    <dd
                      className={
                        isEmpty
                          ? "whitespace-pre-wrap text-sm text-[color:var(--muted-foreground)]"
                          : "whitespace-pre-wrap text-sm"
                      }
                    >
                      {display}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </CardContent>
        </Card>

        {hasNext && (
          <Card>
            <CardContent className="p-6">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[color:var(--muted-foreground)]">
                Next Rehearsal
              </h2>
              <div className="space-y-1 text-sm">
                {(report.nextRehearsalDate ||
                  report.nextRehearsalTime ||
                  report.nextRehearsalLocation) && (
                  <p>
                    {[
                      report.nextRehearsalDate
                        ? formatDate(report.nextRehearsalDate)
                        : null,
                      report.nextRehearsalTime,
                      report.nextRehearsalLocation,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                )}
                {report.nextRehearsalNotes && (
                  <p className="whitespace-pre-wrap text-[color:var(--muted-foreground)]">
                    {report.nextRehearsalNotes}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {report.scheduleNotes && (
          <Card>
            <CardContent className="p-6">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[color:var(--muted-foreground)]">
                Schedule Notes
              </h2>
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: report.scheduleNotes }}
              />
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-6">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[color:var(--muted-foreground)]">
              Attachments
            </h2>

            {attachmentUrls.length > 0 && (
              <div className="mb-4 space-y-2">
                {attachmentUrls.map((a) => (
                  <a
                    key={a.id}
                    href={a.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-md border border-[color:var(--border)] p-3 text-sm transition-colors hover:bg-[color:var(--accent)]"
                  >
                    <Paperclip className="h-4 w-4 text-[color:var(--muted-foreground)]" aria-hidden />
                    <span className="flex-1 truncate font-medium">
                      {a.fileName}
                    </span>
                    <span className="text-xs text-[color:var(--muted-foreground)]">
                      {formatFileSize(a.fileSize)}
                    </span>
                  </a>
                ))}
              </div>
            )}

            {attachmentUrls.length === 0 && !canUpload && (
              <p className="text-sm text-[color:var(--muted-foreground)]">
                No attachments.
              </p>
            )}

            {canUpload && <AttachmentUpload reportId={reportId} />}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
