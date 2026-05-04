import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Plus, FileText, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requireCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getOrCreateDefaultOrganization } from "@/lib/organization";
import { getProductionBySlug } from "@/features/productions/queries";
import { getProductionMembership } from "@/features/members/queries";
import { getReportsByProduction } from "@/features/reports/queries";

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
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
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <Link
          href={`/productions/${slug}`}
          className="text-sm text-[color:var(--muted-foreground)] underline underline-offset-4 hover:text-[color:var(--foreground)]"
        >
          &larr; Back to {production.title}
        </Link>
        <div className="mt-3 flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">
            Rehearsal Reports
          </h1>
          {canCreate && (
            <Link href={`/productions/${slug}/reports/new`}>
              <Button>
                <Plus className="h-4 w-4" aria-hidden />
                New report
              </Button>
            </Link>
          )}
        </div>
        <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
          {production.title}
        </p>
      </div>

      {reports.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="mb-3 h-10 w-10 text-[color:var(--muted-foreground)]" />
            <p className="text-sm font-medium">No reports yet</p>
            <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
              {canCreate
                ? "Create the first rehearsal report for this production."
                : "No rehearsal reports have been filed yet."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => {
            const authorName =
              report.createdByFirstName || report.createdByLastName
                ? `${report.createdByFirstName} ${report.createdByLastName}`.trim()
                : report.createdByEmail;

            return (
              <Link
                key={report.id}
                href={`/productions/${slug}/reports/${report.id}`}
              >
                <Card className="transition-colors hover:bg-[color:var(--accent)]">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-[color:var(--muted-foreground)]" aria-hidden />
                          <h2 className="text-sm font-semibold">
                            {formatDate(report.reportDate)}
                          </h2>
                        </div>
                        <p className="mt-1 line-clamp-2 text-sm text-[color:var(--muted-foreground)]">
                          {report.generalNotes}
                        </p>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-[color:var(--muted-foreground)]">
                      Filed by {authorName}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
