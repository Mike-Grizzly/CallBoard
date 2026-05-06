import { DEPARTMENTS } from "./constants";
import type { ReportDetail } from "./queries";

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

export function formatReportAsEmail(
  report: ReportDetail,
  productionTitle: string,
  authorName: string,
): string {
  const lines: string[] = [];

  const numberLabel = report.reportNumber
    ? `Rehearsal Report #${report.reportNumber}`
    : "Rehearsal Report";
  lines.push(`${productionTitle} — ${numberLabel}`);
  lines.push(formatDateLong(report.reportDate));
  lines.push(`Stage Manager: ${authorName}`);

  const timeBits: string[] = [];
  if (report.scheduledCall) timeBits.push(`Call ${report.scheduledCall}`);
  if (report.actualStart) timeBits.push(`Start ${report.actualStart}`);
  if (report.endTime) timeBits.push(`End ${report.endTime}`);
  if (timeBits.length > 0) lines.push(timeBits.join(" · "));

  lines.push("");
  lines.push("GENERAL NOTES");
  lines.push("-------------");
  lines.push(htmlToPlainText(report.generalNotes) || "None");
  lines.push("");

  lines.push("DEPARTMENT NOTES");
  lines.push("----------------");
  for (const dept of DEPARTMENTS) {
    const value = report[dept.key] as string | null;
    lines.push(`${dept.label}: ${value && value.trim() ? value.trim() : "None"}`);
  }
  lines.push("");

  const hasNext =
    report.nextRehearsalDate ||
    report.nextRehearsalTime ||
    report.nextRehearsalLocation ||
    report.nextRehearsalNotes;

  if (hasNext) {
    lines.push("NEXT REHEARSAL");
    lines.push("--------------");
    const headerBits: string[] = [];
    if (report.nextRehearsalDate)
      headerBits.push(formatDateLong(report.nextRehearsalDate));
    if (report.nextRehearsalTime) headerBits.push(report.nextRehearsalTime);
    if (report.nextRehearsalLocation)
      headerBits.push(report.nextRehearsalLocation);
    if (headerBits.length > 0) lines.push(headerBits.join(" · "));
    if (report.nextRehearsalNotes) lines.push(report.nextRehearsalNotes);
    lines.push("");
  }

  return lines.join("\n").trimEnd();
}
