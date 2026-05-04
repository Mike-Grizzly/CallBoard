import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Paperclip } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { requireCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getOrCreateDefaultOrganization } from "@/lib/organization";
import { getProductionBySlug } from "@/features/productions/queries";
import { getProductionMembership } from "@/features/members/queries";
import { getReportById } from "@/features/reports/queries";
import {
  getReportAttachments,
  getAttachmentUrl,
} from "@/features/reports/attachments";
import { AttachmentUpload } from "./attachment-upload";

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

  const attachments = await getReportAttachments(reportId);
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

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <Link
          href={`/productions/${slug}/reports`}
          className="text-sm text-[color:var(--muted-foreground)] underline underline-offset-4 hover:text-[color:var(--foreground)]"
        >
          &larr; Back to reports
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">
          Rehearsal Report — {formatDate(report.reportDate)}
        </h1>
        <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
          {production.title} · Filed by {authorName}
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[color:var(--muted-foreground)]">
              General Notes
            </h2>
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: report.generalNotes }}
            />
          </CardContent>
        </Card>

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
