import { DEPARTMENTS } from "./constants";
import type { ReportDetail } from "./queries";

function formatDateLong(d: string): string {
  return new Date(d).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function row(label: string, value: string, empty: boolean): string {
  return `
    <tr>
      <td style="padding:6px 12px 6px 0;width:180px;vertical-align:top;font-weight:600;font-size:14px;color:#374151;white-space:nowrap;">${label}</td>
      <td style="padding:6px 0;font-size:14px;color:${empty ? "#9ca3af" : "#111827"};">${value}</td>
    </tr>`;
}

function section(title: string, content: string): string {
  return `
  <div style="margin-bottom:28px;">
    <div style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#6b7280;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid #e5e7eb;">${title}</div>
    ${content}
  </div>`;
}

export function formatReportAsHtml(
  report: ReportDetail,
  productionTitle: string,
  authorName: string,
): string {
  const reportLabel = report.reportNumber
    ? `Rehearsal Report #${report.reportNumber}`
    : "Rehearsal Report";

  const timeParts: string[] = [];
  if (report.scheduledCall) timeParts.push(`<strong>Call:</strong> ${report.scheduledCall}`);
  if (report.actualStart) timeParts.push(`<strong>Start:</strong> ${report.actualStart}`);
  if (report.endTime) timeParts.push(`<strong>End:</strong> ${report.endTime}`);

  const deptRows = DEPARTMENTS.map((dept) => {
    const val = report[dept.key] as string | null;
    const empty = !val || !val.trim();
    return row(dept.label, empty ? "None" : val!.trim().replace(/\n/g, "<br>"), empty);
  }).join("");

  const hasNext =
    report.nextRehearsalDate ||
    report.nextRehearsalTime ||
    report.nextRehearsalLocation ||
    report.nextRehearsalNotes;

  const nextParts: string[] = [];
  if (report.nextRehearsalDate) nextParts.push(formatDateLong(report.nextRehearsalDate));
  if (report.nextRehearsalTime) nextParts.push(report.nextRehearsalTime);
  if (report.nextRehearsalLocation) nextParts.push(report.nextRehearsalLocation);

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
            <div style="font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#94a3b8;margin-bottom:6px;">${productionTitle}</div>
            <div style="font-size:22px;font-weight:700;color:#ffffff;margin-bottom:4px;">${reportLabel}</div>
            <div style="font-size:14px;color:#cbd5e1;">${formatDateLong(report.reportDate)}</div>
            <div style="font-size:13px;color:#94a3b8;margin-top:6px;">Filed by ${authorName}</div>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px;">

            ${timeParts.length > 0 ? section("Times", `<div style="font-size:14px;color:#374151;">${timeParts.join(" &nbsp;·&nbsp; ")}</div>`) : ""}

            ${section("General Notes", `<div style="font-size:14px;color:#111827;line-height:1.6;">${report.generalNotes || "<span style='color:#9ca3af;'>None</span>"}</div>`)}

            ${section("Department Notes", `<table cellpadding="0" cellspacing="0" style="width:100%;">${deptRows}</table>`)}

            ${hasNext ? section("Next Rehearsal", `
              ${nextParts.length > 0 ? `<div style="font-size:14px;font-weight:600;color:#111827;margin-bottom:6px;">${nextParts.join(" &nbsp;·&nbsp; ")}</div>` : ""}
              ${report.nextRehearsalNotes ? `<div style="font-size:14px;color:#374151;white-space:pre-wrap;">${report.nextRehearsalNotes}</div>` : ""}
            `) : ""}

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
