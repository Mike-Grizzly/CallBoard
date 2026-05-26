import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import type { ReportWithAuthor } from "@/features/reports/queries";

/**
 * Mobile-only rehearsal reports list. Rendered alongside the desktop
 * table; the desktop table is hidden at <=720px via `.reports-desktop`
 * and this component appears via `.reports-mobile` in globals.css.
 * Card layout mirrors the Claude-design mobile demo: date strip on the
 * left, report number + status pill + summary in the middle, chevron
 * on the right.
 */
export function MobileReportsList({
  reports,
  basePath,
}: {
  reports: ReportWithAuthor[];
  basePath: string;
}) {
  return (
    <div className="reports-mobile">
      <div className="mr-list">
        {reports.map((r) => {
          const d = new Date(`${r.reportDate}T00:00:00`);
          const weekday = d.toLocaleDateString("en-US", { weekday: "short" });
          const dayNum = d.getDate();
          const numLabel = r.reportNumber
            ? `R-${String(r.reportNumber).padStart(2, "0")}`
            : "—";
          const summary =
            (r.generalNotes ?? "")
              .replace(/<[^>]+>/g, " ")
              .replace(/\s+/g, " ")
              .trim() || null;
          const isDraft = r.status === "draft";
          const author =
            r.createdByFirstName || r.createdByLastName
              ? `${r.createdByFirstName ?? ""} ${r.createdByLastName ?? ""}`.trim()
              : r.createdByEmail;
          return (
            <Link key={r.id} href={`${basePath}/${r.id}`} className="mr-card">
              <div className="mr-date">
                <span className="mr-date-wd">{weekday}</span>
                <span className="mr-date-num">{dayNum}</span>
              </div>
              <div className="mr-body">
                <div className="mr-meta">
                  <span className="mr-num">{numLabel}</span>
                  <span
                    className="mr-pill"
                    data-c={isDraft ? "amber" : "sage"}
                  >
                    {isDraft ? "Draft" : "Distributed"}
                  </span>
                </div>
                {summary ? (
                  <div className="mr-summary">{summary}</div>
                ) : (
                  <div className="mr-summary mr-summary-empty">No notes</div>
                )}
                <div className="mr-foot">{author}</div>
              </div>
              <Icon name="ChevronRight" className="mr-chev ico" aria-hidden />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
