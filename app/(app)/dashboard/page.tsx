import Link from "next/link";
import {
  Calendar,
  Theater,
  Users,
  FileText,
  FolderOpen,
  Megaphone,
  Pin,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getProductionsByOrganization } from "@/features/productions/queries";
import { getUserProductions } from "@/features/productions/queries";
import { getOrCreateDefaultOrganization } from "@/lib/organization";
import { getOrganizationMembers } from "@/features/members/queries";
import { getAnnouncementsForUser } from "@/features/announcements/queries";

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

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

function roleLabel(role: string): string {
  const labels: Record<string, string> = {
    admin: "Admin",
    producer: "Producer",
    director: "Director",
    stage_manager: "Stage Manager",
    cast: "Cast",
    crew: "Crew",
  };
  return labels[role] ?? role;
}

export default async function DashboardPage() {
  const user = await requireCurrentUser();
  const org = await getOrCreateDefaultOrganization();
  const canManage = can(user.role, "productions:manage");

  const [myProductions, allProductions, orgMembers, allAnnouncements] = await Promise.all([
    getUserProductions(user.id),
    canManage ? getProductionsByOrganization(org.id) : Promise.resolve([]),
    canManage ? getOrganizationMembers(org.id) : Promise.resolve([]),
    getAnnouncementsForUser(user.id, org.id, canManage),
  ]);

  const recentAnnouncements = allAnnouncements.slice(0, 5);

  const greeting = user.firstName
    ? `Welcome back, ${user.firstName}`
    : "Welcome back";

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">{greeting}</h1>
        <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
          Here&apos;s an overview of your productions and activity.
        </p>
      </div>

      {recentAnnouncements.length > 0 && (
        <div className="mb-8">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-[color:var(--muted-foreground)]" aria-hidden />
              <h2 className="text-sm font-semibold">Announcements</h2>
            </div>
            <Link
              href="/announcements"
              className="text-xs text-[color:var(--muted-foreground)] underline underline-offset-4 hover:text-[color:var(--foreground)]"
            >
              View all
            </Link>
          </div>
          <div className="space-y-2">
            {recentAnnouncements.map((item) => {
              const isOrgWide = item.productionId === null;
              return (
                <div
                  key={item.id}
                  className={`rounded-lg border px-4 py-3 ${
                    item.pinned
                      ? "border-amber-300 bg-amber-50 text-amber-900"
                      : "border-[color:var(--border)] bg-[color:var(--muted)]"
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    {item.pinned && (
                      <Pin className="h-3 w-3 shrink-0 text-amber-600" aria-hidden />
                    )}
                    <span className="text-sm font-medium">{item.title}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        item.pinned
                          ? "bg-amber-200 text-amber-800"
                          : "bg-[color:var(--muted)]"
                      }`}
                    >
                      {isOrgWide ? "Org-wide" : (item.productionTitle ?? "Production")}
                    </span>
                  </div>
                  {item.body && (
                    <p className="mt-1 line-clamp-1 text-xs opacity-75">
                      {item.body.replace(/<[^>]+>/g, "")}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {canManage && (
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <Theater className="h-8 w-8 text-[color:var(--muted-foreground)]" aria-hidden />
              <div>
                <p className="text-2xl font-bold">{allProductions.length}</p>
                <p className="text-xs text-[color:var(--muted-foreground)]">
                  Productions
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <Users className="h-8 w-8 text-[color:var(--muted-foreground)]" aria-hidden />
              <div>
                <p className="text-2xl font-bold">{orgMembers.length}</p>
                <p className="text-xs text-[color:var(--muted-foreground)]">
                  Team Members
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <Theater className="h-8 w-8 text-[color:var(--muted-foreground)]" aria-hidden />
              <div>
                <p className="text-2xl font-bold">
                  {allProductions.filter((p) => p.status === "active").length}
                </p>
                <p className="text-xs text-[color:var(--muted-foreground)]">
                  Active Shows
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">My Productions</h2>
        <Link href="/productions">
          <Button variant="outline" size="sm">
            View all
          </Button>
        </Link>
      </div>

      {myProductions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Theater className="mb-3 h-10 w-10 text-[color:var(--muted-foreground)]" />
            <p className="text-sm font-medium">No productions yet</p>
            <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
              {canManage
                ? "Create a production and assign yourself to get started."
                : "You haven't been assigned to any productions yet."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {myProductions.map((production) => (
            <Link
              key={production.id}
              href={`/productions/${production.slug}`}
            >
              <Card className="transition-colors hover:bg-[color:var(--muted)]">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="truncate text-sm font-semibold">
                          {production.title}
                        </h3>
                        <StatusBadge status={production.status} />
                        <span className="inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                          {roleLabel(production.role)}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-1 text-xs text-[color:var(--muted-foreground)]">
                        <Calendar className="h-3 w-3" aria-hidden />
                        <span>
                          {formatDate(production.openingDate)}
                          {production.closingDate &&
                            ` — ${formatDate(production.closingDate)}`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex gap-4 border-t border-[color:var(--border)] pt-3">
                    <div className="flex items-center gap-1.5 text-xs text-[color:var(--muted-foreground)]">
                      <FileText className="h-3 w-3" aria-hidden />
                      <span>Reports</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-[color:var(--muted-foreground)]">
                      <FolderOpen className="h-3 w-3" aria-hidden />
                      <span>Documents</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-[color:var(--muted-foreground)]">
                      <Megaphone className="h-3 w-3" aria-hidden />
                      <span>Announcements</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
