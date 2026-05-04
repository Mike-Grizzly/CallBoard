import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { requireCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getOrCreateDefaultOrganization } from "@/lib/organization";
import { getProductionBySlug } from "@/features/productions/queries";
import { getProductionMembership } from "@/features/members/queries";
import { getReportById } from "@/features/reports/queries";

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
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

  const authorName =
    report.createdByFirstName || report.createdByLastName
      ? `${report.createdByFirstName} ${report.createdByLastName}`.trim()
      : report.createdByEmail;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <Link
          href={`/productions/${slug}/reports`}
          className="text-sm text-[color:var(--muted-foreground)] underline underline-offset-4 hover:text-[color:var(--foreground)]"
        >
          &larr; Back to reports
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">
          Rehearsal Report — {formatDate(report.reportDate)}
        </h1>
        <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
          {production.title} · Filed by {authorName}
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[color:var(--muted-foreground)]">
              General Notes
            </h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">
              {report.generalNotes}
            </p>
          </CardContent>
        </Card>

        {report.scheduleNotes && (
          <Card>
            <CardContent className="p-6">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[color:var(--muted-foreground)]">
                Schedule Notes
              </h2>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                {report.scheduleNotes}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
