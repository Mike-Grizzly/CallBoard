import { Icon } from "@/components/ui/icon";
import { RichTextDisplay } from "@/components/ui/rich-text-display";
import { MentionText } from "@/components/ui/mention-text";
import { DEPARTMENTS } from "@/features/reports/constants";
import type { ReportDetail } from "@/features/reports/queries";
import type { ProductionMember } from "@/features/members/queries";
import { PinButton } from "@/features/pins/pin-button";
import { EmailReportButton } from "./email-report-button";
import { AttachmentUpload } from "./attachment-upload";

interface AttachmentWithUrl {
  id: string;
  fileName: string;
  fileSize: number;
  url: string;
}

function formatLongDate(dateStr: string) {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function hasText(html: string | null | undefined): boolean {
  if (!html) return false;
  return !!html.replace(/<[^>]+>/g, "").trim();
}

/**
 * Mobile-only report detail. Renders alongside the desktop layout;
 * the desktop is hidden at <=720px via `.report-detail-desktop` and
 * this component appears via `.report-detail-mobile` in globals.css.
 * Stacks every section vertically (no tabbed panels) to match the
 * Claude-design mobile demo.
 */
export function MobileReportDetail({
  report,
  productionTitle,
  authorName,
  reportNumLabel,
  attachments,
  productionMembers,
  isPinned,
  canEdit,
  canUpload,
  slug,
  reportId,
  autoOpenEmail = false,
}: {
  report: ReportDetail;
  productionTitle: string;
  authorName: string;
  reportNumLabel: string | null;
  attachments: AttachmentWithUrl[];
  productionMembers: ProductionMember[];
  isPinned: boolean;
  canEdit: boolean;
  canUpload: boolean;
  slug: string;
  reportId: string;
  autoOpenEmail?: boolean;
}) {
  const isDraft = report.status === "draft";
  const hasNext =
    report.nextRehearsalDate ||
    report.nextRehearsalTime ||
    report.nextRehearsalLocation ||
    report.nextRehearsalNotes;

  return (
    <div className="report-detail-mobile">
      {/* Header — status, number, actions */}
      <div className="rd-head">
        <div className="rd-head-meta">
          <span className="mr-pill" data-c={isDraft ? "amber" : "sage"}>
            {isDraft ? "Draft" : "Distributed"}
          </span>
          {reportNumLabel ? (
            <span className="rd-head-num">{reportNumLabel}</span>
          ) : null}
        </div>
        <div className="rd-head-actions">
          <PinButton
            itemType="report"
            itemId={reportId}
            initialPinned={isPinned}
          />
          <EmailReportButton
            reportId={reportId}
            slug={slug}
            members={productionMembers}
            autoOpen={autoOpenEmail}
          />
        </div>
      </div>
      <h1 className="rd-title">{formatLongDate(report.reportDate)}</h1>
      <div className="rd-sub">
        {productionTitle} · Filed by {authorName}
      </div>

      {/* Hero card — times + attendance */}
      <div className="rd-hero">
        <div className="rd-hero-times">
          <div className="rd-hero-time">
            <div className="rd-hero-h">Call</div>
            <div className="rd-hero-val">{report.scheduledCall || "—"}</div>
          </div>
          <div className="rd-hero-time">
            <div className="rd-hero-h">Start</div>
            <div className="rd-hero-val">{report.actualStart || "—"}</div>
          </div>
          <div className="rd-hero-time">
            <div className="rd-hero-h">End</div>
            <div className="rd-hero-val">{report.endTime || "—"}</div>
          </div>
        </div>
        <div className="rd-hero-stats">
          <div className="rd-stat" data-c="sage">
            <div className="rd-stat-n">{report.attendancePresent}</div>
            <div className="rd-stat-l">Present</div>
          </div>
          <div className="rd-stat" data-c="amber">
            <div className="rd-stat-n">{report.attendanceAbsent}</div>
            <div className="rd-stat-l">Absent</div>
          </div>
          <div className="rd-stat">
            <div className="rd-stat-n">{report.attendanceLate}</div>
            <div className="rd-stat-l">Late</div>
          </div>
        </div>
      </div>

      {canEdit ? (
        <a
          href={`/productions/${slug}/reports/${reportId}/edit`}
          className="rd-edit-btn"
        >
          <Icon name="PenLine" size={14} aria-hidden />
          <span>Edit report</span>
        </a>
      ) : null}

      {/* General notes */}
      {hasText(report.generalNotes) ? (
        <section className="rd-section">
          <h3 className="rd-section-h">General notes</h3>
          <div className="rd-card">
            <RichTextDisplay content={report.generalNotes} />
          </div>
        </section>
      ) : null}

      {/* Scenes worked */}
      {report.scenesWorked.length > 0 ? (
        <section className="rd-section">
          <h3 className="rd-section-h">Scenes worked</h3>
          <div className="rd-stack">
            {report.scenesWorked.map((s, i) => (
              <div key={i} className="rd-scene">
                <div className="rd-scene-label">{s.label || "—"}</div>
                <div className="rd-scene-meta">
                  {s.pages ? <span>pp. {s.pages}</span> : null}
                  {s.pages && s.time ? <span className="rd-sep">·</span> : null}
                  {s.time ? <span className="rd-mono">{s.time}</span> : null}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Next rehearsal */}
      {hasNext ? (
        <section className="rd-section">
          <h3 className="rd-section-h">Next rehearsal</h3>
          <div className="rd-card">
            <div className="rd-next-line">
              {[
                report.nextRehearsalDate
                  ? formatLongDate(report.nextRehearsalDate)
                  : null,
                report.nextRehearsalTime,
                report.nextRehearsalLocation,
              ]
                .filter(Boolean)
                .join(" · ") || "—"}
            </div>
            {report.nextRehearsalNotes ? (
              <div className="rd-next-notes">
                {report.nextRehearsalNotes}
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* Department notes — every dept as a small card, "no notes" italicized */}
      <section className="rd-section">
        <h3 className="rd-section-h">Department notes</h3>
        <div className="rd-stack">
          {DEPARTMENTS.map((d) => {
            const value = (report[d.key] as string | null) ?? "";
            const empty = !hasText(value);
            return (
              <div key={d.key} className="rd-dept">
                <div className="rd-dept-h">
                  <div className="notif-ico rd-dept-ico" data-c={d.c}>
                    <Icon name={d.icon} size={13} aria-hidden />
                  </div>
                  <b className="rd-dept-label">{d.label}</b>
                </div>
                {empty ? (
                  <div className="rd-dept-empty">No notes</div>
                ) : (
                  <div className="rd-dept-body">
                    <RichTextDisplay content={value} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Schedule changes */}
      {report.scheduleChanges.length > 0 ? (
        <section className="rd-section">
          <h3 className="rd-section-h">Schedule changes</h3>
          <div className="rd-stack">
            {report.scheduleChanges.map((s, i) => (
              <div key={i} className="rd-change">
                <span className="mr-pill" data-c={s.c || ""}>
                  {s.who || "—"}
                </span>
                <span className="rd-change-what">{s.what ? <MentionText text={s.what} /> : "—"}</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Line notes */}
      {report.lineNotes.length > 0 ? (
        <section className="rd-section">
          <h3 className="rd-section-h">Line notes</h3>
          <div className="rd-stack">
            {report.lineNotes.map((l, i) => (
              <div key={i} className="rd-line">
                <b className="rd-line-who">{l.who || "—"}</b>
                {l.line ? (
                  <div className="rd-line-cue">{l.line}</div>
                ) : null}
                {l.issue ? (
                  <div className="rd-line-issue"><MentionText text={l.issue} /></div>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Injuries */}
      {report.injuries.length > 0 ? (
        <section className="rd-section">
          <h3 className="rd-section-h">Injuries / incidents</h3>
          <div className="rd-stack">
            {report.injuries.map((inj, i) => (
              <div key={i} className="rd-injury">
                <div className="rd-injury-h">
                  <Icon name="AlertTriangle" size={14} aria-hidden />
                  <b className="rd-injury-who">{inj.who || "—"}</b>
                  {inj.time ? (
                    <span className="rd-mono rd-injury-time">{inj.time}</span>
                  ) : null}
                </div>
                {inj.text ? (
                  <div className="rd-injury-text"><MentionText text={inj.text} /></div>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Attachments */}
      <section className="rd-section">
        <h3 className="rd-section-h">Attachments</h3>
        {attachments.length > 0 ? (
          <div className="rd-stack">
            {attachments.map((a) => (
              <a
                key={a.id}
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rd-attach"
              >
                <Icon name="Paperclip" size={14} aria-hidden />
                <span className="rd-attach-name">{a.fileName}</span>
                <span className="rd-mono rd-attach-size">
                  {formatFileSize(a.fileSize)}
                </span>
              </a>
            ))}
          </div>
        ) : !canUpload ? (
          <div className="rd-empty">No attachments.</div>
        ) : null}
        {canUpload ? <AttachmentUpload reportId={reportId} /> : null}
      </section>
    </div>
  );
}
