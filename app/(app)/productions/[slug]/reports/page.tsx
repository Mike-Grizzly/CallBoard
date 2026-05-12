import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { requireCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getOrCreateDefaultOrganization } from "@/lib/organization";
import { getProductionBySlug } from "@/features/productions/queries";
import { getProductionMembership } from "@/features/members/queries";
import { getReportsByProduction } from "@/features/reports/queries";

type Filter = "all" | "draft" | "distributed";

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

function FilterChip({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      prefetch
      style={{
        appearance: "none",
        textDecoration: "none",
        border: "1px solid " + (active ? "var(--border-strong)" : "transparent"),
        background: active ? "var(--bg-elev)" : "transparent",
        boxShadow: active ? "var(--shadow-1)" : "none",
        borderRadius: 999,
        height: 28,
        padding: "0 12px",
        fontSize: 12.5,
        fontWeight: active ? 500 : 400,
        color: active ? "var(--ink)" : "var(--ink-3)",
        display: "inline-flex",
        alignItems: "center",
      }}
    >
      {label}
    </Link>
  );
}

export default async function ReportsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { slug } = await params;
  const { status: rawStatus } = await searchParams;
  const filter: Filter =
    rawStatus === "draft" || rawStatus === "distributed" ? rawStatus : "all";

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

  const allReports = await getReportsByProduction(production.id);
  const canCreate = can(user.role, "reports:create");

  const total = allReports.length;
  const drafts = allReports.filter((r) => r.status === "draft").length;
  const distributed = allReports.filter(
    (r) => r.status === "distributed",
  ).length;

  const filtered =
    filter === "all"
      ? allReports
      : allReports.filter((r) => r.status === filter);

  const base = `/productions/${slug}/reports`;

  return (
    <div className="page-narrow anim-in" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="row-between">
        <div>
          <h2 className="h-section">Rehearsal reports</h2>
          <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>
            {total} {total === 1 ? "report" : "reports"} · {drafts} draft
            {drafts === 1 ? "" : "s"} · {distributed} distributed
          </div>
        </div>
        {canCreate && (
          <Link href={`${base}/new`} prefetch>
            <button className="btn primary">
              <Icon name="Plus" size={14} aria-hidden />
              <span>New report</span>
            </button>
          </Link>
        )}
      </div>

      <div className="row" style={{ gap: 6 }}>
        <FilterChip
          href={base}
          active={filter === "all"}
          label={`All · ${total}`}
        />
        <FilterChip
          href={`${base}?status=draft`}
          active={filter === "draft"}
          label={`Drafts · ${drafts}`}
        />
        <FilterChip
          href={`${base}?status=distributed`}
          active={filter === "distributed"}
          label={`Distributed · ${distributed}`}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="card card-pad" style={{ textAlign: "center", padding: "48px 16px" }}>
          <Icon name="FileText" size={28} aria-hidden />
          <div style={{ marginTop: 10, fontSize: 14, fontWeight: 500, color: "var(--ink-2)" }}>
            {total === 0
              ? "No reports yet"
              : filter === "draft"
                ? "No drafts"
                : "No distributed reports"}
          </div>
          <div className="muted" style={{ marginTop: 4, fontSize: 13 }}>
            {total === 0 && canCreate
              ? "Create the first rehearsal report for this production."
              : total === 0
                ? "No rehearsal reports have been filed yet."
                : "Try clearing the filter."}
          </div>
        </div>
      ) : (
        <div className="card" style={{ overflow: "hidden" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "70px 140px 1fr 160px 90px 130px",
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
            <span>Status</span>
          </div>
          {filtered.map((report) => {
            const { weekday, date } = formatReportDate(report.reportDate);
            const author =
              report.createdByFirstName || report.createdByLastName
                ? `${report.createdByFirstName ?? ""} ${report.createdByLastName ?? ""}`.trim()
                : report.createdByEmail;
            const summary = summarize(report.generalNotes);
            const pill =
              report.status === "distributed"
                ? { c: "sage", label: "Distributed" }
                : { c: "amber", label: "Draft" };
            return (
              <Link
                key={report.id}
                href={`${base}/${report.id}`}
                className="report-row"
                style={{
                  display: "grid",
                  gridTemplateColumns: "70px 140px 1fr 160px 90px 130px",
                  padding: "12px 16px",
                  borderBottom: "1px solid var(--border)",
                  alignItems: "center",
                  fontSize: 13,
                  color: "var(--ink)",
                  textDecoration: "none",
                }}
              >
                <span className="mono" style={{ fontSize: 12, color: "var(--ink-3)" }}>
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
                <span className="muted" style={{ fontSize: 12.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {author}
                </span>
                <span className="mono muted" style={{ fontSize: 12 }}>
                  {formatFiled(report.createdAt)}
                </span>
                <span>
                  <span className="pill" data-c={pill.c}>
                    <span className="dot" />
                    {pill.label}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
