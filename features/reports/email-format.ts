import { DEPARTMENTS } from "./constants";
import type { ReportDetail } from "./queries";
import type { EmailAttachmentMeta } from "./email-html";

function htmlToPlainText(html: string): string {
  if (!html) return "";
  return html
    .replace(/<\s*br\s*\/?\s*>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6])>/gi, "\n")
    .replace(/<li[^>]*>/gi, "  - ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function formatDateLong(d: string): string {
  return new Date(d).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function header(label: string): string[] {
  return [label.toUpperCase(), "-".repeat(label.length)];
}

export function formatReportAsEmail(
  report: ReportDetail,
  productionTitle: string,
  authorName: string,
  attachments: EmailAttachmentMeta[] = [],
): string {
  const lines: string[] = [];

  const numberLabel = report.reportNumber
    ? `Rehearsal Report #${report.reportNumber}`
    : "Rehearsal Report";
  lines.push(`${productionTitle} — ${numberLabel}`);
  lines.push(formatDateLong(report.reportDate));
  lines.push(`Filed by: ${authorName}`);

  const timeBits: string[] = [];
  if (report.scheduledCall) timeBits.push(`Call ${report.scheduledCall}`);
  if (report.actualStart) timeBits.push(`Start ${report.actualStart}`);
  if (report.endTime) timeBits.push(`End ${report.endTime}`);
  if (timeBits.length > 0) lines.push(timeBits.join(" · "));

  // Attendance
  const attendanceTotal =
    report.attendancePresent + report.attendanceAbsent + report.attendanceLate;
  const attendanceNotes = report.attendanceNotes ?? [];
  if (attendanceTotal > 0 || attendanceNotes.length > 0) {
    lines.push("");
    lines.push(...header("Attendance"));
    if (attendanceTotal > 0) {
      lines.push(
        `Present ${report.attendancePresent} · Absent ${report.attendanceAbsent} · Late ${report.attendanceLate}`,
      );
    }
    for (const a of attendanceNotes) {
      lines.push(`  - ${a.who}: ${a.note}`);
    }
  }

  // General notes
  lines.push("");
  lines.push(...header("General Notes"));
  lines.push(htmlToPlainText(report.generalNotes) || "None");

  // Scenes worked
  const scenesWorked = report.scenesWorked ?? [];
  if (scenesWorked.length > 0) {
    lines.push("");
    lines.push(...header("Scenes Worked"));
    for (const s of scenesWorked) {
      const meta = [s.pages, s.time].filter(Boolean).join(" · ");
      lines.push(`  - ${s.label}${meta ? ` (${meta})` : ""}`);
    }
  }

  // Breaks
  const breaks = report.breaks ?? [];
  if (breaks.length > 0) {
    lines.push("");
    lines.push(...header("Breaks"));
    for (const b of breaks) {
      lines.push(`  - ${b.kind} — ${b.start}${b.end ? `–${b.end}` : ""}`);
    }
  }

  // Schedule changes
  const scheduleChanges = report.scheduleChanges ?? [];
  if (scheduleChanges.length > 0) {
    lines.push("");
    lines.push(...header("Schedule Changes"));
    for (const s of scheduleChanges) {
      lines.push(`  - ${s.who}: ${s.what}`);
    }
  }

  // Line notes
  const lineNotes = report.lineNotes ?? [];
  if (lineNotes.length > 0) {
    lines.push("");
    lines.push(...header("Line Notes"));
    for (const l of lineNotes) {
      lines.push(`  - ${l.who}: ${l.line} — ${l.issue}`);
    }
  }

  // Injuries
  const injuries = report.injuries ?? [];
  if (injuries.length > 0) {
    lines.push("");
    lines.push(...header("Injuries / Incidents"));
    for (const i of injuries) {
      lines.push(`  - ${i.who}${i.time ? ` (${i.time})` : ""}: ${i.text}`);
    }
  }

  // Department notes
  lines.push("");
  lines.push(...header("Department Notes"));
  for (const dept of DEPARTMENTS) {
    const value = report[dept.key] as string | null;
    lines.push(
      `${dept.label}: ${value && value.trim() ? value.trim() : "None"}`,
    );
  }

  // Next rehearsal
  const hasNext =
    report.nextRehearsalDate ||
    report.nextRehearsalTime ||
    report.nextRehearsalLocation ||
    report.nextRehearsalNotes;

  if (hasNext) {
    lines.push("");
    lines.push(...header("Next Rehearsal"));
    const headerBits: string[] = [];
    if (report.nextRehearsalDate)
      headerBits.push(formatDateLong(report.nextRehearsalDate));
    if (report.nextRehearsalTime) headerBits.push(report.nextRehearsalTime);
    if (report.nextRehearsalLocation)
      headerBits.push(report.nextRehearsalLocation);
    if (headerBits.length > 0) lines.push(headerBits.join(" · "));
    if (report.nextRehearsalNotes) lines.push(report.nextRehearsalNotes);
  }

  // Attachments
  if (attachments.length > 0) {
    lines.push("");
    lines.push(...header("Attachments"));
    for (const a of attachments) {
      lines.push(`  - ${a.fileName}`);
    }
  }

  return lines.join("\n").trimEnd();
}
