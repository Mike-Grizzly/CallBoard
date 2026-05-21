import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { RichTextDisplay } from "@/components/ui/rich-text-display";
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
import { getIsPinned } from "@/features/pins/queries";
import { PinButton } from "@/features/pins/pin-button";
import { AttachmentUpload } from "./attachment-upload";
import { EmailReportButton } from "./email-report-button";
import { DetailTabs } from "./detail-tabs";

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

function StatBlock({
  n,
  label,
  c,
}: {
  n: number;
  label: string;
  c: string;
}) {
  const bg = c ? `var(--c-${c}-soft)` : "var(--bg-sunken)";
  const fg = c
    ? `color-mix(in oklch, var(--c-${c}) 50%, var(--ink))`
    : "var(--ink)";
  return (
    <div
      style={{
        textAlign: "center",
        padding: "10px 4px",
        background: bg,
        borderRadius: 6,
      }}
    >
      <div style={{ fontSize: 22, fontWeight: 600, color: fg }}>{n}</div>
      <div className="h-eyebrow">{label}</div>
    </div>
  );
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

  const [attachments, productionMembers, isPinned] = await Promise.all([
    getReportAttachments(reportId),
    getProductionMembers(production.id),
    getIsPinned(user.id, "report", reportId),
  ]);
  const canUpload = can(user.role, "reports:create");
  const canEdit = can(user.role, "reports:create");

  const attachmentUrls = await Promise.all(
    attachments.map(async (a) => ({
      ...a,
      url: await getAttachmentUrl(a.id),
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
    return v && v.replace(/<[^>]+>/g, "").trim();
  }).length;

  const statusPill =
    report.status === "distributed"
      ? { c: "sage", label: "Distributed" }
      : { c: "amber", label: "Draft" };

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
          <span className="pill" data-c={statusPill.c}>
            <span className="dot" />
            {statusPill.label}
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
            <PinButton itemType="report" itemId={reportId} initialPinned={isPinned} />
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

      {/* 3-col summary: Call times / Attendance / Scenes worked */}
      <div className="grid grid-3" style={{ gap: 16, alignItems: "start" }}>
        <div className="card card-pad">
          <h3 className="h-card" style={{ marginBottom: 8 }}>Call times</h3>
          <div className="row" style={{ gap: 16, marginBottom: report.breaks.length > 0 ? 10 : 0 }}>
            <div>
              <div className="h-eyebrow" style={{ marginBottom: 2 }}>Call</div>
              <div className="mono" style={{ fontSize: 16, fontWeight: 500 }}>
                {report.scheduledCall || "—"}
              </div>
            </div>
            <div>
              <div className="h-eyebrow" style={{ marginBottom: 2 }}>Start</div>
              <div className="mono" style={{ fontSize: 16, fontWeight: 500 }}>
                {report.actualStart || "—"}
              </div>
            </div>
            <div style={{ marginLeft: "auto", textAlign: "right" }}>
              <div className="h-eyebrow" style={{ marginBottom: 2 }}>End</div>
              <div className="mono" style={{ fontSize: 16, fontWeight: 500 }}>
                {report.endTime || "—"}
              </div>
            </div>
          </div>
          {report.breaks.length > 0 && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                paddingTop: 10,
                borderTop: "1px solid var(--border)",
              }}
            >
              <div className="h-eyebrow">Breaks</div>
              {report.breaks.map((b, i) => (
                <div key={i} className="row" style={{ gap: 8, fontSize: 12 }}>
                  <span className="mono">{b.start || "—"}</span>
                  <span className="muted">→</span>
                  <span className="mono">{b.end || "—"}</span>
                  <span className="pill" style={{ marginLeft: "auto" }} data-c="sand">
                    {b.kind}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card card-pad">
          <h3 className="h-card" style={{ marginBottom: 10 }}>Attendance</h3>
          <div className="grid grid-3" style={{ gap: 8, marginBottom: 10 }}>
            <StatBlock n={report.attendancePresent} label="Present" c="sage" />
            <StatBlock n={report.attendanceAbsent} label="Absent" c="amber" />
            <StatBlock n={report.attendanceLate} label="Late" c="" />
          </div>
          {report.attendanceNotes.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 6 }}>
              {report.attendanceNotes.map((n, i) => (
                <div
                  key={i}
                  className="row"
                  style={{
                    gap: 8,
                    padding: "8px 10px",
                    background: "var(--c-amber-soft)",
                    borderRadius: 6,
                  }}
                >
                  <Icon name="Info" size={13} aria-hidden />
                  <div style={{ fontSize: 12.5 }}>
                    <b style={{ fontWeight: 500 }}>{n.who || "—"}</b>
                    {n.note && (
                      <>
                        <br />
                        <span className="muted">{n.note}</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card card-pad">
          <h3 className="h-card" style={{ marginBottom: 10 }}>Scenes worked</h3>
          {report.scenesWorked.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {report.scenesWorked.map((s, i) => (
                <div
                  key={i}
                  style={{
                    padding: "10px 12px",
                    background: "var(--bg-sunken)",
                    borderRadius: 6,
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>
                    {s.label || "—"}
                  </div>
                  <div className="row" style={{ gap: 10, fontSize: 12 }}>
                    {s.pages && <span className="muted">pp. {s.pages}</span>}
                    {s.pages && s.time && <span className="muted">·</span>}
                    {s.time && <span className="mono">{s.time}</span>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="muted" style={{ fontSize: 13 }}>No scenes logged.</div>
          )}
        </div>
      </div>

      {/* General notes + Next rehearsal share a row to reduce scrolling */}
      {((report.generalNotes && report.generalNotes.replace(/<[^>]+>/g, "").trim()) || hasNext) && (
        <div className="grid grid-3" style={{ gap: 16 }}>
          {report.generalNotes && report.generalNotes.replace(/<[^>]+>/g, "").trim() ? (
            <div className="card card-pad" style={{ gridColumn: hasNext ? "span 2" : "1 / -1" }}>
              <h3 className="h-card" style={{ marginBottom: 10 }}>General notes</h3>
              <RichTextDisplay content={report.generalNotes} />
            </div>
          ) : null}
          {hasNext && (
            <div className="card card-pad">
              <h3 className="h-card" style={{ marginBottom: 10 }}>Next rehearsal</h3>
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
            </div>
          )}
        </div>
      )}

      {/* Bottom subtabs: Department notes / Schedule changes / Line notes / Injuries */}
      <DetailTabs
        tabs={[
          { id: "notes", label: "Department notes", count: filedNotes },
          { id: "sched", label: "Schedule changes", count: report.scheduleChanges.length },
          { id: "lines", label: "Line notes", count: report.lineNotes.length },
          { id: "injuries", label: "Injuries / incidents", count: report.injuries.length },
        ]}
        panels={{
          notes: (
            <div className="grid grid-2" style={{ gap: 14 }}>
              {DEPARTMENTS.map((d) => {
                const value = (report[d.key] as string | null) ?? "";
                const empty = !value.replace(/<[^>]+>/g, "").trim();
                return (
                  <div
                    key={d.key}
                    style={{
                      padding: "10px 12px",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-s)",
                    }}
                  >
                    <div className="row" style={{ gap: 8, marginBottom: 6 }}>
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
                      <RichTextDisplay content={value} />
                    )}
                  </div>
                );
              })}
            </div>
          ),
          sched:
            report.scheduleChanges.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {report.scheduleChanges.map((s, i) => (
                  <div
                    key={i}
                    className="row"
                    style={{
                      gap: 12,
                      padding: "12px 14px",
                      background: "var(--bg-sunken)",
                      borderRadius: 6,
                    }}
                  >
                    <span className="pill" data-c={s.c || ""}>{s.who || "—"}</span>
                    <span style={{ fontSize: 13 }}>{s.what || "—"}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "32px 0", color: "var(--ink-3)" }}>
                <Icon name="Calendar" size={26} aria-hidden />
                <div style={{ marginTop: 8, fontSize: 13.5 }}>No schedule changes today</div>
              </div>
            ),
          lines:
            report.lineNotes.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "160px 220px 1fr",
                    gap: 12,
                    padding: "6px 12px",
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: ".06em",
                    textTransform: "uppercase",
                    color: "var(--ink-4)",
                  }}
                >
                  <span>Character</span>
                  <span>Line / cue</span>
                  <span>Note</span>
                </div>
                {report.lineNotes.map((l, i) => (
                  <div
                    key={i}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "160px 220px 1fr",
                      gap: 12,
                      padding: "10px 12px",
                      borderTop: "1px solid var(--border)",
                      fontSize: 13,
                      alignItems: "center",
                    }}
                  >
                    <b style={{ fontWeight: 500 }}>{l.who || "—"}</b>
                    <span className="mono muted">{l.line || "—"}</span>
                    <span>{l.issue || "—"}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "32px 0", color: "var(--ink-3)" }}>
                <Icon name="PenLine" size={26} aria-hidden />
                <div style={{ marginTop: 8, fontSize: 13.5 }}>No line notes</div>
              </div>
            ),
          injuries:
            report.injuries.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {report.injuries.map((inj, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "12px 14px",
                      background: "var(--c-amber-soft)",
                      borderRadius: 6,
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                    }}
                  >
                    <div className="row" style={{ gap: 10 }}>
                      <Icon name="AlertTriangle" size={16} aria-hidden />
                      <b style={{ fontWeight: 500 }}>{inj.who || "—"}</b>
                      {inj.time && (
                        <span className="mono muted" style={{ marginLeft: "auto" }}>
                          {inj.time}
                        </span>
                      )}
                    </div>
                    {inj.text && (
                      <div style={{ fontSize: 13, paddingLeft: 26, whiteSpace: "pre-wrap" }}>
                        {inj.text}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "32px 0", color: "var(--ink-3)" }}>
                <Icon name="Check" size={28} aria-hidden />
                <div style={{ marginTop: 8, fontSize: 14, fontWeight: 500, color: "var(--ink-2)" }}>
                  No incidents reported
                </div>
              </div>
            ),
        }}
      />

      {report.scheduleNotes && report.scheduleNotes.replace(/<[^>]+>/g, "").trim() && (
        <div className="card card-pad">
          <h3 className="h-card" style={{ marginBottom: 10 }}>Schedule notes</h3>
          <RichTextDisplay content={report.scheduleNotes} />
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
