import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  Users,
  FileText,
  FolderOpen,
  Megaphone,
  PenLine,
  MapPin,
  ChevronRight,
  Layout,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { requireCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getOrCreateDefaultOrganization } from "@/lib/organization";
import { getProductionBySlug } from "@/features/productions/queries";
import {
  getProductionMembers,
  getProductionMembership,
} from "@/features/members/queries";
import { getReportsByProduction } from "@/features/reports/queries";
import { getDocumentsByProduction } from "@/features/documents/queries";
import { getAnnouncementsByProduction } from "@/features/announcements/queries";
import { getNextCall } from "@/features/calls/queries";
import { ProductionTabs } from "./production-tabs";

const STATUS_DISPLAY: Record<string, { label: string; dot: string }> = {
  active: { label: "In rehearsal", dot: "bg-green-500" },
  draft: { label: "Draft", dot: "bg-gray-400" },
  archived: { label: "Archived", dot: "bg-amber-500" },
};

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  producer: "Producer",
  director: "Director",
  choreographer: "Choreographer",
  stage_manager: "SM",
  cast: "Cast",
  crew: "Crew",
};

const AVATAR_COLORS = [
  "bg-[#8b4a6b]",
  "bg-[#4a7a8b]",
  "bg-[#6b8b4a]",
  "bg-[#8b6b4a]",
  "bg-[#4a4a8b]",
  "bg-[#8b4a4a]",
  "bg-[#4a8b6b]",
  "bg-[#7a4a8b]",
];

function avatarColor(name: string): string {
  let hash = 0;
  for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[Math.abs(hash)];
}

function memberInitials(
  firstName: string | null,
  lastName: string | null,
  email: string,
): string {
  if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase();
  if (firstName) return firstName[0].toUpperCase();
  return email[0].toUpperCase();
}

function memberDisplayName(
  firstName: string | null,
  lastName: string | null,
  email: string,
): string {
  return `${firstName ?? ""} ${lastName ?? ""}`.trim() || email;
}

function formatCallTime(stored: string | null | undefined): string | null {
  if (!stored) return null;
  const m = stored.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return stored; // old free-text fallback
  const h = parseInt(m[1]);
  const mins = m[2];
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${mins} ${period}`;
}

function relativeTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${Math.max(1, mins)}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const target = new Date(`${dateStr}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / 86_400_000);
}

function isToday(dateStr: string): boolean {
  return dateStr === new Date().toISOString().split("T")[0];
}

function formatCallDate(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00`);
  return {
    month: d.toLocaleDateString("en-US", { month: "long" }),
    day: String(d.getDate()),
    dayOfWeek: d.toLocaleDateString("en-US", { weekday: "long" }).toUpperCase(),
  };
}

function formatOpeningDate(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
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

  if (!production) notFound();

  const canManage = can(user.role, "productions:manage");
  if (!canManage) {
    const membership = await getProductionMembership(user.id, production.id);
    if (!membership) redirect("/productions");
  }

  const canCreateReports = can(user.role, "reports:create");
  const canViewBlocking = can(user.role, "blocking:view");
  const canViewNotes = can(user.role, "notes:view");

  const [members, reports, documents, announcements, nextCall] =
    await Promise.all([
      getProductionMembers(production.id),
      getReportsByProduction(production.id),
      getDocumentsByProduction(production.id),
      getAnnouncementsByProduction(production.id, org.id),
      getNextCall(production.id),
    ]);

  const tabs = [
    { label: "Overview", href: `/productions/${slug}` },
    { label: "Calls", href: `/productions/${slug}/calls` },
    {
      label: "Reports",
      href: `/productions/${slug}/reports`,
      count: reports.length,
    },
    {
      label: "Announcements",
      href: `/productions/${slug}/announcements`,
      count: announcements.length,
    },
    {
      label: "Documents",
      href: `/productions/${slug}/documents`,
      count: documents.length,
    },
  ];
  if (canCreateReports)
    tabs.push({ label: "Daily Log", href: `/productions/${slug}/log` });
  if (canViewBlocking)
    tabs.push({ label: "Blocking", href: `/productions/${slug}/blocking` });
  if (canViewNotes)
    tabs.push({ label: "Notes", href: `/productions/${slug}/notes` });

  const director = members.find((m) => m.role === "director");
  const directorName = director
    ? memberDisplayName(director.firstName, director.lastName, director.email)
    : null;

  const daysToOpen = daysUntil(production.openingDate);

  const callDisplay = nextCall
    ? {
        ...formatCallDate(nextCall.callDate),
        id: nextCall.id,
        time: formatCallTime(nextCall.callTime),
        endTime: formatCallTime(nextCall.endTime),
        location: nextCall.location,
        focus: nextCall.focus,
        scenes: nextCall.scenes,
        castCalled: nextCall.castCalled,
        schedule: nextCall.schedule,
        notes: nextCall.notes,
        isToday: isToday(nextCall.callDate),
        isLive: nextCall.isLive,
      }
    : null;

  // Build recent activity feed from reports, documents, announcements
  const activity = [
    ...reports.slice(0, 10).map((r) => ({
      id: r.id,
      kind: "report" as const,
      title: `Report #${r.reportNumber ?? "—"} filed`,
      subtitle: `For ${new Date(`${r.reportDate}T00:00:00`).toLocaleDateString("en-US", { month: "long", day: "numeric" })}`,
      href: `/productions/${slug}/reports/${r.id}`,
      createdAt: new Date(r.createdAt),
    })),
    ...documents.slice(0, 10).map((d) => ({
      id: d.id,
      kind: "document" as const,
      title: d.title,
      subtitle: `${d.uploadedByFirstName ?? d.uploadedByEmail} uploaded a document`,
      href: `/productions/${slug}/documents/${d.id}`,
      createdAt: new Date(d.createdAt),
    })),
    ...announcements.slice(0, 10).map((a) => ({
      id: a.id,
      kind: "announcement" as const,
      title: a.title,
      subtitle: `${a.authorFirstName ?? a.authorEmail} posted an announcement`,
      href: `/productions/${slug}/announcements`,
      createdAt: new Date(a.createdAt),
    })),
  ]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 8);

  const principals = members.filter((m) => m.characterName);
  const teamList = principals.length > 0 ? principals : members;
  const statusInfo = STATUS_DISPLAY[production.status] ?? STATUS_DISPLAY.draft;

  return (
    <div className="mx-auto max-w-5xl">
      {/* ── Header ── */}
      <div className="mb-6">
        <nav className="mb-3 flex items-center gap-1.5 text-sm text-[color:var(--muted-foreground)]">
          <Link
            href="/productions"
            className="hover:text-[color:var(--foreground)] transition-colors"
          >
            Productions
          </Link>
          <span>/</span>
          <span className="text-[color:var(--foreground)]">
            {production.title}
          </span>
        </nav>

        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-4xl font-bold tracking-tight leading-tight">
              {production.title}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[color:var(--muted-foreground)]">
              <span
                className={`inline-block h-1.5 w-1.5 rounded-full ${statusInfo.dot}`}
              />
              <span>{statusInfo.label}</span>
              {production.openingDate && (
                <>
                  <span>·</span>
                  <span>Opens {formatOpeningDate(production.openingDate)}</span>
                </>
              )}
              {production.closingDate && (
                <>
                  <span>·</span>
                  <span>
                    Closes{" "}
                    {new Date(
                      `${production.closingDate}T00:00:00`,
                    ).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </>
              )}
              {directorName && (
                <>
                  <span>·</span>
                  <span>Dir. {directorName}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {canManage && (
              <Link href={`/productions/${slug}/members`}>
                <Button variant="outline" size="sm">
                  <Users className="h-4 w-4" />
                  Cast &amp; Crew
                </Button>
              </Link>
            )}
            {canCreateReports && (
              <Link href={`/productions/${slug}/calls`}>
                <Button variant="outline" size="sm">
                  Calls
                </Button>
              </Link>
            )}
            {canCreateReports && (
              <Link href={`/productions/${slug}/reports/new`}>
                <Button
                  size="sm"
                  className="bg-[#c4572a] hover:bg-[#a84320] text-white border-0"
                >
                  + New report
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <ProductionTabs slug={slug} tabs={tabs} />

      {/* ── Call Card ── */}
      {callDisplay ? (
        <div
          className="mb-8 rounded-2xl p-7 text-white overflow-hidden"
          style={{ background: "linear-gradient(135deg, #1e1008 0%, #0c0603 100%)" }}
        >
          {/* Top row */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
                  callDisplay.isLive
                    ? "bg-[#c4572a] text-white"
                    : callDisplay.isToday
                      ? "bg-amber-500/80 text-white"
                      : "bg-white/10 text-white/70"
                }`}
              >
                {callDisplay.isLive && (
                  <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                )}
                {callDisplay.isLive
                  ? "Live · In Rehearsal"
                  : callDisplay.isToday
                    ? "Today's Call"
                    : "Upcoming Call"}
              </span>
              {daysToOpen !== null && daysToOpen > 0 && (
                <span className="text-white/40 text-sm">
                  · {daysToOpen} day{daysToOpen !== 1 ? "s" : ""} to opening
                </span>
              )}
              {daysToOpen === 0 && (
                <span className="text-[#c4572a] text-sm font-medium">
                  · Opening night!
                </span>
              )}
            </div>
            {canCreateReports && (
              <Link href={`/productions/${slug}/calls/${callDisplay.id}/edit`}>
                <span className="text-xs text-white/40 hover:text-white/70 transition-colors cursor-pointer">
                  Edit call
                </span>
              </Link>
            )}
          </div>

          {/* Date + Time */}
          <div className="flex items-end justify-between gap-4 mb-6">
            <div>
              <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-1">
                {callDisplay.dayOfWeek}
              </p>
              <p className="text-5xl font-bold leading-none">
                {callDisplay.month}{" "}
                <span style={{ color: "#c4572a" }}>{callDisplay.day}</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-1">
                Call
              </p>
              <p className="text-4xl font-light">
                {callDisplay.time ?? (
                  <span className="text-white/30 text-2xl">TBD</span>
                )}
              </p>
              {callDisplay.endTime && (
                <p className="text-white/40 text-sm mt-0.5">
                  until {callDisplay.endTime}
                </p>
              )}
            </div>
          </div>

          {/* Schedule breakdown */}
          {callDisplay.schedule && (
            <div className="border-t border-white/10 pt-4 mb-5">
              <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-2">
                Schedule
              </p>
              <div className="space-y-1.5">
                {callDisplay.schedule
                  .split("\n")
                  .map((l) => l.trim())
                  .filter(Boolean)
                  .map((line, i) => (
                    <p key={i} className="text-white/80 text-sm font-mono">
                      {line}
                    </p>
                  ))}
              </div>
            </div>
          )}

          {/* Details grid — shows whichever fields are filled */}
          {(callDisplay.focus ||
            callDisplay.scenes ||
            callDisplay.castCalled ||
            callDisplay.location) && (
            <div className="border-t border-white/10 pt-5 mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {callDisplay.focus && (
                <div>
                  <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-1">
                    Working
                  </p>
                  <p className="text-white text-sm">{callDisplay.focus}</p>
                </div>
              )}
              {callDisplay.scenes && (
                <div>
                  <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-1">
                    Scenes / Numbers
                  </p>
                  <p className="text-white text-sm whitespace-pre-line">
                    {callDisplay.scenes}
                  </p>
                </div>
              )}
              {callDisplay.castCalled && (
                <div>
                  <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-1">
                    Cast Called
                  </p>
                  <p className="text-white text-sm whitespace-pre-line">
                    {callDisplay.castCalled}
                  </p>
                </div>
              )}
              {callDisplay.location && (
                <div>
                  <div className="flex items-center gap-1.5 text-white/40 text-xs font-semibold uppercase tracking-widest mb-1">
                    <MapPin className="h-3 w-3" />
                    Location
                  </div>
                  <p className="text-white text-sm">{callDisplay.location}</p>
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            {canCreateReports && (
              <Link href={`/productions/${slug}/reports/new`}>
                <span className="inline-flex items-center gap-2 rounded-full bg-[#c4572a] px-4 py-2 text-sm font-medium text-white hover:bg-[#a84320] transition-colors cursor-pointer">
                  <FileText className="h-4 w-4" />
                  File tonight&apos;s report
                  <ChevronRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            )}
            <Link href={`/productions/${slug}/documents`}>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/[0.15] transition-colors cursor-pointer">
                <FolderOpen className="h-4 w-4" />
                Documents
              </span>
            </Link>
            {canViewNotes && (
              <Link href={`/productions/${slug}/notes`}>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/[0.15] transition-colors cursor-pointer">
                  <PenLine className="h-4 w-4" />
                  My notes
                </span>
              </Link>
            )}
            {canViewBlocking && (
              <Link href={`/productions/${slug}/blocking`}>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/[0.15] transition-colors cursor-pointer">
                  <Layout className="h-4 w-4" />
                  Stage blocking
                </span>
              </Link>
            )}
          </div>
        </div>
      ) : (
        canCreateReports && (
          <div className="mb-8 rounded-2xl border border-dashed border-[color:var(--border)] p-8 text-center">
            <p className="text-sm font-medium text-[color:var(--foreground)]">
              No upcoming calls scheduled
            </p>
            <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
              Schedule calls in advance — add details as they're confirmed.
            </p>
            <Link href={`/productions/${slug}/calls`}>
              <Button size="sm" className="mt-4">
                Open call schedule
              </Button>
            </Link>
          </div>
        )
      )}

      {/* ── Two-column body ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold">Recent activity</h2>
            <Link
              href={`/productions/${slug}/reports`}
              className="text-sm text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] transition-colors"
            >
              View all
            </Link>
          </div>

          {activity.length === 0 ? (
            <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] px-6 py-12 text-center">
              <p className="text-sm text-[color:var(--muted-foreground)]">
                No activity yet. File the first report to get started.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] divide-y divide-[color:var(--border)]">
              {activity.map((item) => (
                <Link key={item.id} href={item.href}>
                  <div className="flex items-start gap-3 px-4 py-3 hover:bg-[color:var(--accent)] transition-colors">
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[color:var(--muted)]">
                      {item.kind === "report" && (
                        <FileText className="h-3.5 w-3.5 text-[color:var(--muted-foreground)]" />
                      )}
                      {item.kind === "document" && (
                        <FolderOpen className="h-3.5 w-3.5 text-[color:var(--muted-foreground)]" />
                      )}
                      {item.kind === "announcement" && (
                        <Megaphone className="h-3.5 w-3.5 text-[color:var(--muted-foreground)]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[color:var(--foreground)] truncate">
                        {item.title}
                      </p>
                      <p className="text-xs text-[color:var(--muted-foreground)] truncate">
                        {item.subtitle}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-[color:var(--muted-foreground)] tabular-nums">
                      {relativeTime(item.createdAt)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Principals / Team */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold">
              {principals.length > 0 ? "Principals" : "Team"}
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-[color:var(--muted-foreground)]">
                {teamList.length > 10
                  ? `10 of ${members.length}`
                  : `${teamList.length} of ${members.length}`}
              </span>
              {canManage && (
                <Link
                  href={`/productions/${slug}/members`}
                  className="text-xs text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] transition-colors"
                >
                  Manage
                </Link>
              )}
            </div>
          </div>

          {members.length === 0 ? (
            <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] px-6 py-10 text-center">
              <Users className="mx-auto mb-2 h-7 w-7 text-[color:var(--muted-foreground)]" />
              <p className="text-sm text-[color:var(--muted-foreground)]">
                {canManage
                  ? "Assign team members to this production."
                  : "No team members assigned yet."}
              </p>
              {canManage && (
                <Link href={`/productions/${slug}/members`}>
                  <Button variant="outline" size="sm" className="mt-3">
                    Manage team
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] divide-y divide-[color:var(--border)]">
              {teamList.slice(0, 10).map((member) => {
                const name = memberDisplayName(
                  member.firstName,
                  member.lastName,
                  member.email,
                );
                const initials = memberInitials(
                  member.firstName,
                  member.lastName,
                  member.email,
                );
                const color = avatarColor(name);
                const badge = member.characterName
                  ? "Principal"
                  : (ROLE_LABELS[member.role] ?? member.role);

                return (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${color}`}
                    >
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[color:var(--foreground)] truncate">
                        {member.characterName ?? name}
                      </p>
                      {member.characterName && (
                        <p className="text-xs text-[color:var(--muted-foreground)] truncate">
                          {name}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 rounded bg-[color:var(--muted)] px-1.5 py-0.5 text-xs font-medium text-[color:var(--muted-foreground)]">
                      {badge}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
