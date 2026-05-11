import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { requireCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getOrCreateDefaultOrganization } from "@/lib/organization";
import { getProductionBySlug } from "@/features/productions/queries";
import { getProductionMembership } from "@/features/members/queries";
import { getReportsByProduction } from "@/features/reports/queries";

function formatReportDate(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00`);
  return {
    weekday: d.toLocaleDateString("en-US", { weekday: "short" }),
    date: d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
  };
}

function formatFiled(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function summarize(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export default async function ReportsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
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

  const reports = await getReportsByProduction(production.id);
  const canCreate = can(user.role, "reports:create");

  return (
    <div className="page-narrow anim-in" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="row-between">
        <div>
          <h2 className="h-section">Rehearsal reports</h2>
          <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>
            {reports.length} {reports.length === 1 ? "report" : "reports"}
          </div>
        </div>
        {canCreate && (
          <Link href={`/productions/${slug}/reports/new`}>
            <button className="btn primary">
              <Icon name="Plus" size={14} aria-hidden />
              <span>New report</span>
            </button>
          </Link>
        )}
      </div>

      {reports.length === 0 ? (
        <div className="card card-pad" style={{ textAlign: "center", padding: "48px 16px" }}>
          <Icon name="FileText" size={28} className="mx-auto" aria-hidden />
          <div style={{ marginTop: 10, fontSize: 14, fontWeight: 500, color: "var(--ink-2)" }}>
            No reports yet
          </div>
          <div className="muted" style={{ marginTop: 4, fontSize: 13 }}>
            {canCreate
              ? "Create the first rehearsal report for this production."
              : "No rehearsal reports have been filed yet."}
          </div>
        </div>
      ) : (
        <div className="card" style={{ overflow: "hidden" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "80px 150px 1fr 180px 120px",
              padding: "10px 16px",
              borderBottom: "1px solid var(--border)",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: ".06em",
              textTransform: "uppercase",
              color: "var(--ink-4)",
            }}
          >
            <span>No.</span>
            <span>Date</span>
            <span>Summary</span>
            <span>Author</span>
            <span>Filed</span>
          </div>
          {reports.map((report) => {
            const { weekday, date } = formatReportDate(report.reportDate);
            const author =
              report.createdByFirstName || report.createdByLastName
                ? `${report.createdByFirstName ?? ""} ${report.createdByLastName ?? ""}`.trim()
                : report.createdByEmail;
            const summary = summarize(report.generalNotes);
            return (
              <Link
                key={report.id}
                href={`/productions/${slug}/reports/${report.id}`}
                className="report-row"
                style={{
                  display: "grid",
                  gridTemplateColumns: "80px 150px 1fr 180px 120px",
                  padding: "12px 16px",
                  borderBottom: "1px solid var(--border)",
                  alignItems: "center",
                  fontSize: 13,
                  color: "var(--ink)",
                  textDecoration: "none",
                }}
              >
                <span
                  className="mono"
                  style={{ fontSize: 12, color: "var(--ink-3)" }}
                >
                  {report.reportNumber ? `R-${String(report.reportNumber).padStart(2, "0")}` : "—"}
                </span>
                <span>
                  <b style={{ fontWeight: 500 }}>{weekday}</b>{" "}
                  <span className="muted">{date}</span>
                </span>
                <span
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    color: summary ? "var(--ink-2)" : "var(--ink-4)",
                    fontStyle: summary ? "normal" : "italic",
                  }}
                >
                  {summary || "No notes"}
                </span>
                <span className="muted" style={{ fontSize: 12.5 }}>
                  {author}
                </span>
                <span className="mono muted" style={{ fontSize: 12 }}>
                  {formatFiled(report.createdAt)}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
