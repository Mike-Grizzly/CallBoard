import {
  reportDeptHtml,
  type ResolvedDepartment,
} from "@/features/productions/departments";
import type { ReportDetail } from "./queries";

export type EmailAttachmentMeta = {
  fileName: string;
  fileSize: number;
};

function formatDateLong(d: string): string {
  return new Date(d).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function section(title: string, content: string): string {
  return `
  <div style="margin-bottom:24px;">
    <div style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#6b7280;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid #e5e7eb;">${title}</div>
    ${content}
  </div>`;
}

function statTile(label: string, value: number | string, color: string): string {
  return `
    <td align="center" style="padding:10px 6px;background:${color};border-radius:6px;width:33%;">
      <div style="font-size:22px;font-weight:700;color:#111827;line-height:1;">${value}</div>
      <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#6b7280;margin-top:4px;">${label}</div>
    </td>`;
}

function deptBlock(label: string, value: string | null): string {
  const hasValue = !!value && !!value.trim();
  return `
    <div style="margin-bottom:16px;padding:10px 12px;border-left:3px solid #1e293b;background:#f8fafc;border-radius:0 6px 6px 0;">
      <div style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#1e293b;margin-bottom:6px;">${label}</div>
      <div style="font-size:14px;color:${hasValue ? "#111827" : "#9ca3af"};line-height:1.55;">${
        hasValue ? value!.trim().replace(/\n/g, "<br>") : "—"
      }</div>
    </div>`;
}

export function formatReportAsHtml(
  report: ReportDetail,
  productionTitle: string,
  authorName: string,
  attachments: EmailAttachmentMeta[] = [],
  departments: ResolvedDepartment[] = [],
): string {
  const reportLabel = report.reportNumber
    ? `Rehearsal Report #${report.reportNumber}`
    : "Rehearsal Report";

  // Times
  const timeParts: string[] = [];
  if (report.scheduledCall)
    timeParts.push(`<strong>Call:</strong> ${escapeHtml(report.scheduledCall)}`);
  if (report.actualStart)
    timeParts.push(`<strong>Start:</strong> ${escapeHtml(report.actualStart)}`);
  if (report.endTime)
    timeParts.push(`<strong>End:</strong> ${escapeHtml(report.endTime)}`);

  // Attendance stat tiles
  const attendanceTotal =
    report.attendancePresent + report.attendanceAbsent + report.attendanceLate;
  const showAttendance = attendanceTotal > 0 || report.attendanceNotes.length > 0;

  // Department notes (stacked layout)
  const deptBlocks = departments
    .map((dept) => deptBlock(dept.label, reportDeptHtml(dept, report)))
    .join("");

  // Breaks
  const breaks = report.breaks ?? [];
  const breakList = breaks.length
    ? `<ul style="margin:0;padding-left:18px;font-size:14px;color:#111827;line-height:1.6;">${breaks
        .map(
          (b) =>
            `<li>${escapeHtml(b.kind)} — ${escapeHtml(b.start)}${
              b.end ? `–${escapeHtml(b.end)}` : ""
            }</li>`,
        )
        .join("")}</ul>`
    : "";

  // Scenes worked
  const scenesWorked = report.scenesWorked ?? [];
  const scenesList = scenesWorked.length
    ? `<ul style="margin:0;padding-left:18px;font-size:14px;color:#111827;line-height:1.6;">${scenesWorked
        .map((s) => {
          const meta = [s.pages, s.time].filter(Boolean).join(" · ");
          return `<li><strong>${escapeHtml(s.label)}</strong>${
            meta ? ` <span style="color:#6b7280;">(${escapeHtml(meta)})</span>` : ""
          }</li>`;
        })
        .join("")}</ul>`
    : "";

  // Schedule changes
  const scheduleChanges = report.scheduleChanges ?? [];
  const scheduleList = scheduleChanges.length
    ? `<ul style="margin:0;padding-left:18px;font-size:14px;color:#111827;line-height:1.6;">${scheduleChanges
        .map(
          (s) =>
            `<li><strong>${escapeHtml(s.who)}:</strong> ${escapeHtml(s.what)}</li>`,
        )
        .join("")}</ul>`
    : "";

  // Attendance notes (separate from counts)
  const attendanceNotes = report.attendanceNotes ?? [];
  const attendanceNotesList = attendanceNotes.length
    ? `<ul style="margin:8px 0 0;padding-left:18px;font-size:14px;color:#111827;line-height:1.6;">${attendanceNotes
        .map(
          (a) =>
            `<li><strong>${escapeHtml(a.who)}:</strong> ${escapeHtml(a.note)}</li>`,
        )
        .join("")}</ul>`
    : "";

  // Line notes
  const lineNotes = report.lineNotes ?? [];
  const lineNotesList = lineNotes.length
    ? `<ul style="margin:0;padding-left:18px;font-size:14px;color:#111827;line-height:1.6;">${lineNotes
        .map(
          (l) =>
            `<li><strong>${escapeHtml(l.who)}:</strong> ${escapeHtml(
              l.line,
            )} <span style="color:#6b7280;">— ${escapeHtml(l.issue)}</span></li>`,
        )
        .join("")}</ul>`
    : "";

  // Injuries
  const injuries = report.injuries ?? [];
  const injuriesList = injuries.length
    ? `<ul style="margin:0;padding-left:18px;font-size:14px;color:#111827;line-height:1.6;">${injuries
        .map(
          (i) =>
            `<li><strong>${escapeHtml(i.who)}</strong>${
              i.time ? ` <span style="color:#6b7280;">(${escapeHtml(i.time)})</span>` : ""
            }: ${escapeHtml(i.text)}</li>`,
        )
        .join("")}</ul>`
    : "";

  // Next rehearsal
  const hasNext =
    report.nextRehearsalDate ||
    report.nextRehearsalTime ||
    report.nextRehearsalLocation ||
    report.nextRehearsalNotes;

  const nextParts: string[] = [];
  if (report.nextRehearsalDate)
    nextParts.push(formatDateLong(report.nextRehearsalDate));
  if (report.nextRehearsalTime) nextParts.push(escapeHtml(report.nextRehearsalTime));
  if (report.nextRehearsalLocation)
    nextParts.push(escapeHtml(report.nextRehearsalLocation));

  // Attachments
  const attachmentsList = attachments.length
    ? `<ul style="margin:0;padding-left:18px;font-size:14px;color:#111827;line-height:1.6;">${attachments
        .map(
          (a) =>
            `<li>${escapeHtml(a.fileName)} <span style="color:#6b7280;">(${formatFileSize(
              a.fileSize,
            )})</span></li>`,
        )
        .join("")}</ul>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">

        <!-- Header -->
        <tr>
          <td style="background:#1e293b;padding:28px 32px;">
            <div style="font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#94a3b8;margin-bottom:6px;">${escapeHtml(productionTitle)}</div>
            <div style="font-size:22px;font-weight:700;color:#ffffff;margin-bottom:4px;">${reportLabel}</div>
            <div style="font-size:14px;color:#cbd5e1;">${formatDateLong(report.reportDate)}</div>
            <div style="font-size:13px;color:#94a3b8;margin-top:6px;">Filed by ${escapeHtml(authorName)}</div>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:28px 32px;">

            ${timeParts.length > 0 ? section("Times", `<div style="font-size:14px;color:#374151;">${timeParts.join(" &nbsp;·&nbsp; ")}</div>`) : ""}

            ${
              showAttendance
                ? section(
                    "Attendance",
                    `<table cellpadding="0" cellspacing="6" style="width:100%;border-collapse:separate;border-spacing:6px 0;"><tr>${statTile(
                      "Present",
                      report.attendancePresent,
                      "#f0fdf4",
                    )}${statTile(
                      "Absent",
                      report.attendanceAbsent,
                      "#fef2f2",
                    )}${statTile(
                      "Late",
                      report.attendanceLate,
                      "#fffbeb",
                    )}</tr></table>${attendanceNotesList}`,
                  )
                : ""
            }

            ${section("General Notes", `<div style="font-size:14px;color:#111827;line-height:1.6;">${report.generalNotes || "<span style='color:#9ca3af;'>None</span>"}</div>`)}

            ${scenesWorked.length > 0 ? section("Scenes Worked", scenesList) : ""}

            ${breaks.length > 0 ? section("Breaks", breakList) : ""}

            ${scheduleChanges.length > 0 ? section("Schedule Changes", scheduleList) : ""}

            ${lineNotes.length > 0 ? section("Line Notes", lineNotesList) : ""}

            ${injuries.length > 0 ? section("Injuries / Incidents", injuriesList) : ""}

            ${section("Department Notes", deptBlocks)}

            ${
              hasNext
                ? section(
                    "Next Rehearsal",
                    `${
                      nextParts.length > 0
                        ? `<div style="font-size:14px;font-weight:600;color:#111827;margin-bottom:6px;">${nextParts.join(" &nbsp;·&nbsp; ")}</div>`
                        : ""
                    }${
                      report.nextRehearsalNotes
                        ? `<div style="font-size:14px;color:#374151;white-space:pre-wrap;">${escapeHtml(report.nextRehearsalNotes)}</div>`
                        : ""
                    }`,
                  )
                : ""
            }

            ${
              attachments.length > 0
                ? section(
                    "Attachments",
                    `<div style="font-size:12px;color:#6b7280;margin-bottom:8px;">Attached to this email${attachments.length === 1 ? "" : ` (${attachments.length} files)`}.</div>${attachmentsList}`,
                  )
                : ""
            }

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;border-top:1px solid #e5e7eb;padding:16px 32px;">
            <div style="font-size:12px;color:#9ca3af;text-align:center;">Sent via Proscene</div>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
