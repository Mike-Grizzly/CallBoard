import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
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
import {
  getReportAttachments,
  getAttachmentUrl,
} from "@/features/reports/attachments";
import { AttachmentUpload } from "./attachment-upload";
import { EmailReportButton } from "./email-report-button";

function formatDate(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatShortDate(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
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
  const canEdit = can(user.role, "reports:create");

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

  const reportNumLabel = report.reportNumber
    ? `R-${String(report.reportNumber).padStart(2, "0")}`
    : null;

  const hasNext =
    report.nextRehearsalDate ||
    report.nextRehearsalTime ||
    report.nextRehearsalLocation ||
    report.nextRehearsalNotes;

  const filedNotes = DEPARTMENTS.filter((d) => {
    const v = report[d.key] as string | null;
    return v && v.trim();
  }).length;

  return (
    <div className="page-narrow anim-in" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="card card-pad">
        <div className="row" style={{ gap: 8, marginBottom: 8 }}>
          <Link
            href={`/productions/${slug}/reports`}
            prefetch
            className="btn ghost"
            style={{ padding: "0 8px" }}
          >
            <Icon name="ChevronLeft" size={14} aria-hidden />
            <span>All reports</span>
          </Link>
          <span className="muted">·</span>
          <span className="pill" data-c="sage">
            <span className="dot" />
            Filed
          </span>
        </div>
        <div className="row-between">
          <div>
            <div className="h-eyebrow" style={{ marginBottom: 4 }}>
              Rehearsal Report{reportNumLabel ? ` · ${reportNumLabel}` : ""}
            </div>
            <h2 className="h-section">{formatDate(report.reportDate)}</h2>
            <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
              {production.title} · Filed by {authorName}
            </div>
          </div>
          <div className="row" style={{ gap: 8 }}>
            <EmailReportButton reportId={reportId} slug={slug} members={productionMembers} />
            {canEdit && (
              <Link href={`/productions/${slug}/reports/${reportId}/edit`} prefetch>
                <button className="btn primary">
                  <Icon name="PenLine" size={14} aria-hidden />
                  <span>Edit</span>
                </button>
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-2" style={{ gap: 16 }}>
        <div className="card card-pad">
          <h3 className="h-card" style={{ marginBottom: 10 }}>Call times</h3>
          <div className="row" style={{ gap: 24, alignItems: "flex-end" }}>
            <div>
              <div className="h-eyebrow" style={{ marginBottom: 4 }}>Call</div>
              <div className="mono" style={{ fontSize: 18, fontWeight: 500 }}>
                {report.scheduledCall || "—"}
              </div>
            </div>
            <div>
              <div className="h-eyebrow" style={{ marginBottom: 4 }}>Start</div>
              <div className="mono" style={{ fontSize: 18, fontWeight: 500 }}>
                {report.actualStart || "—"}
              </div>
            </div>
            <div style={{ marginLeft: "auto", textAlign: "right" }}>
              <div className="h-eyebrow" style={{ marginBottom: 4 }}>End</div>
              <div className="mono" style={{ fontSize: 18, fontWeight: 500 }}>
                {report.endTime || "—"}
              </div>
            </div>
          </div>
        </div>

        <div className="card card-pad">
          <h3 className="h-card" style={{ marginBottom: 10 }}>Next rehearsal</h3>
          {hasNext ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ fontSize: 13.5 }}>
                {[
                  report.nextRehearsalDate ? formatShortDate(report.nextRehearsalDate) : null,
                  report.nextRehearsalTime,
                  report.nextRehearsalLocation,
                ]
                  .filter(Boolean)
                  .join(" · ") || "—"}
              </div>
              {report.nextRehearsalNotes && (
                <div className="muted" style={{ fontSize: 12.5, whiteSpace: "pre-wrap" }}>
                  {report.nextRehearsalNotes}
                </div>
              )}
            </div>
          ) : (
            <div className="muted" style={{ fontSize: 13 }}>Not specified</div>
          )}
        </div>
      </div>

      {report.generalNotes && report.generalNotes.replace(/<[^>]+>/g, "").trim() && (
        <div className="card card-pad">
          <h3 className="h-card" style={{ marginBottom: 10 }}>General notes</h3>
          <div
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: report.generalNotes }}
          />
        </div>
      )}

      <div className="card card-pad">
        <div className="row-between" style={{ marginBottom: 14 }}>
          <h3 className="h-card">Department notes</h3>
          <span className="muted" style={{ fontSize: 12 }}>
            {filedNotes} of {DEPARTMENTS.length} filed
          </span>
        </div>
        <div className="grid grid-2" style={{ gap: 14 }}>
          {DEPARTMENTS.map((d) => {
            const value = (report[d.key] as string | null) ?? "";
            const empty = !value.trim();
            return (
              <div
                key={d.key}
                style={{
                  padding: "14px 16px",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-s)",
                }}
              >
                <div className="row" style={{ gap: 8, marginBottom: 8 }}>
                  <div className="notif-ico" data-c={d.c} style={{ width: 24, height: 24 }}>
                    <Icon name={d.icon} size={13} aria-hidden />
                  </div>
                  <b style={{ fontSize: 13, fontWeight: 600 }}>{d.label}</b>
                </div>
                {empty ? (
                  <div style={{ fontSize: 13, lineHeight: 1.55, color: "var(--ink-4)", fontStyle: "italic" }}>
                    No notes
                  </div>
                ) : (
                  <div style={{ fontSize: 13, lineHeight: 1.55, whiteSpace: "pre-wrap" }}>
                    {value}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {report.scheduleNotes && report.scheduleNotes.replace(/<[^>]+>/g, "").trim() && (
        <div className="card card-pad">
          <h3 className="h-card" style={{ marginBottom: 10 }}>Schedule notes</h3>
          <div
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: report.scheduleNotes }}
          />
        </div>
      )}

      <div className="card card-pad">
        <h3 className="h-card" style={{ marginBottom: 10 }}>Attachments</h3>
        {attachmentUrls.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: canUpload ? 14 : 0 }}>
            {attachmentUrls.map((a) => (
              <a
                key={a.id}
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-s)",
                  textDecoration: "none",
                  color: "var(--ink)",
                  fontSize: 13,
                  background: "var(--bg-sunken)",
                }}
              >
                <Icon name="Paperclip" size={14} aria-hidden />
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 500 }}>
                  {a.fileName}
                </span>
                <span className="mono muted" style={{ fontSize: 12 }}>
                  {formatFileSize(a.fileSize)}
                </span>
              </a>
            ))}
          </div>
        ) : (
          !canUpload && (
            <div className="muted" style={{ fontSize: 13 }}>No attachments.</div>
          )
        )}
        {canUpload && <AttachmentUpload reportId={reportId} />}
      </div>
    </div>
  );
}
