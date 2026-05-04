import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Users, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requireCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getOrCreateDefaultOrganization } from "@/lib/organization";
import { getProductionBySlug } from "@/features/productions/queries";
import {
  getProductionMembers,
  getProductionMembership,
} from "@/features/members/queries";
import { getReportsByProduction } from "@/features/reports/queries";

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-700",
    active: "bg-green-100 text-green-700",
    archived: "bg-amber-100 text-amber-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${colors[status] ?? colors.draft}`}
    >
      {status}
    </span>
  );
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function ProductionDetailPage({
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

  const [members, reports] = await Promise.all([
    getProductionMembers(production.id),
    getReportsByProduction(production.id),
  ]);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <Link
          href="/productions"
          className="text-sm text-[color:var(--muted-foreground)] underline underline-offset-4 hover:text-[color:var(--foreground)]"
        >
          &larr; Back to productions
        </Link>
        <div className="mt-3 flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">
            {production.title}
          </h1>
          <StatusBadge status={production.status} />
        </div>
        <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
          {formatDate(production.openingDate)}
          {production.closingDate &&
            ` — ${formatDate(production.closingDate)}`}
        </p>
      </div>

      <div className="mb-6">
        <Link href={`/productions/${slug}/reports`}>
          <Card className="transition-colors hover:bg-[color:var(--accent)]">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-[color:var(--muted-foreground)]" aria-hidden />
                <div>
                  <h2 className="text-sm font-semibold">Rehearsal Reports</h2>
                  <p className="text-xs text-[color:var(--muted-foreground)]">
                    {reports.length === 0
                      ? "No reports filed yet"
                      : `${reports.length} report${reports.length !== 1 ? "s" : ""}`}
                  </p>
                </div>
              </div>
              <span className="text-sm text-[color:var(--muted-foreground)]">
                &rarr;
              </span>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Team</h2>
        {canManage && (
          <Link href={`/productions/${slug}/members`}>
            <Button variant="outline" size="sm">
              <Users className="h-4 w-4" aria-hidden />
              Manage team
            </Button>
          </Link>
        )}
      </div>

      {members.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="mb-3 h-10 w-10 text-[color:var(--muted-foreground)]" />
            <p className="text-sm font-medium">No team members assigned</p>
            <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
              {canManage
                ? "Assign team members to this production."
                : "Ask an admin to assign team members."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {members.map((member) => {
            const roleLabels: Record<string, string> = {
              admin: "Admin",
              producer: "Producer",
              director: "Director",
              stage_manager: "Stage Manager",
              cast: "Cast",
              crew: "Crew",
            };
            const displayName =
              member.firstName || member.lastName
                ? `${member.firstName} ${member.lastName}`.trim()
                : member.email;
            return (
              <Card key={member.id}>
                <CardContent className="flex items-center justify-between p-3">
                  <div>
                    <span className="text-sm font-medium">{displayName}</span>
                    <span className="ml-2 text-xs text-[color:var(--muted-foreground)]">
                      {member.email}
                    </span>
                  </div>
                  <span className="text-xs font-medium text-[color:var(--muted-foreground)]">
                    {roleLabels[member.role] ?? member.role}
                  </span>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
