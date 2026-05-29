import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import { requireCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getProductionBySlug } from "@/features/productions/queries";
import {
  getProductionMembers,
  getProductionMembership,
} from "@/features/members/queries";
import { getReportsByProduction } from "@/features/reports/queries";
import { getDocumentsByProduction } from "@/features/documents/queries";
import { getAnnouncementsByProduction } from "@/features/announcements/queries";
import { getNextCall } from "@/features/calls/queries";

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  producer: "Producer",
  director: "Director",
  choreographer: "Choreographer",
  stage_manager: "SM",
  cast: "Cast",
  crew: "Crew",
};

const AVATAR_PALETTE = ["clay", "sage", "dusk", "amber", "plum", "sand"] as const;
type AvatarColor = (typeof AVATAR_PALETTE)[number];

function avatarColor(name: string): AvatarColor {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length];
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
  if (!m) return stored;
  const h = parseInt(m[1]);
  const mins = m[2];
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${mins}`;
}

function formatCallAmPm(stored: string | null | undefined): string | null {
  if (!stored) return null;
  const m = stored.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  return parseInt(m[1]) >= 12 ? "PM" : "AM";
}

function durationBetween(a: string | null | undefined, b: string | null | undefined): string | null {
  if (!a || !b) return null;
  const [ah, am] = a.split(":").map(Number);
  const [bh, bm] = b.split(":").map(Number);
  const mins = (bh * 60 + bm) - (ah * 60 + am);
  if (mins <= 0) return null;
  const h = Math.floor(mins / 60);
  const mn = mins % 60;
  return h ? (mn ? `${h}h ${mn}m` : `${h}h`) : `${mn}m`;
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

const ACTIVITY_COLOR: Record<string, string> = {
  report: "clay",
  document: "dusk",
  announcement: "amber",
};

export default async function ProductionDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await requireCurrentUser();
  const production = await getProductionBySlug(user.organizationId, slug);

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
      getAnnouncementsByProduction(production.id, user.organizationId),
      getNextCall(production.id),
    ]);

  const daysToOpen = daysUntil(production.openingDate);

  const callDisplay = nextCall
    ? {
        ...formatCallDate(nextCall.callDate),
        id: nextCall.id,
        time: formatCallTime(nextCall.callTime),
        amPm: formatCallAmPm(nextCall.callTime),
        endTime: formatCallTime(nextCall.endTime),
        endAmPm: formatCallAmPm(nextCall.endTime),
        duration: durationBetween(nextCall.callTime, nextCall.endTime),
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

  return (
    <div className="page-narrow anim-in">
      {/* ── Call Hero ── */}
      {callDisplay ? (
        <section className="today-hero" style={{ marginBottom: 16 }}>
          {/* Ambient stage-light gradients */}
          <div className="today-hero-bg" aria-hidden="true">
            <svg viewBox="0 0 1200 420" preserveAspectRatio="none" style={{ width: "100%", height: "100%" }}>
              <defs>
                <radialGradient id="spot1" cx="18%" cy="0%" r="55%">
                  <stop offset="0%" stopColor="rgba(255,180,140,.28)" />
                  <stop offset="100%" stopColor="rgba(255,180,140,0)" />
                </radialGradient>
                <radialGradient id="spot2" cx="92%" cy="10%" r="50%">
                  <stop offset="0%" stopColor="rgba(220,90,60,.22)" />
                  <stop offset="100%" stopColor="rgba(220,90,60,0)" />
                </radialGradient>
                <pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse">
                  <circle cx="1.2" cy="1.2" r="1.2" fill="rgba(255,255,255,.05)" />
                </pattern>
              </defs>
              <rect width="1200" height="420" fill="url(#dots)" />
              <rect width="1200" height="420" fill="url(#spot1)" />
              <rect width="1200" height="420" fill="url(#spot2)" />
            </svg>
          </div>

          <div className="today-hero-content">
            {/* Meta row */}
            <div className="today-meta-row">
              {callDisplay.isLive ? (
                <span className="today-live">
                  <span className="dot" />
                  Live · Today&apos;s call
                </span>
              ) : callDisplay.isToday ? (
                <span className="today-eyebrow">Today&apos;s call</span>
              ) : (
                <span className="today-eyebrow">Upcoming call</span>
              )}
              {daysToOpen !== null && daysToOpen > 0 && (
                <>
                  <span className="today-meta-sep">·</span>
                  <span>{daysToOpen} day{daysToOpen !== 1 ? "s" : ""} to opening</span>
                </>
              )}
              {daysToOpen === 0 && (
                <>
                  <span className="today-meta-sep">·</span>
                  <span style={{ color: "var(--accent)" }}>Opening night!</span>
                </>
              )}
              {canCreateReports && (
                <>
                  <span className="today-meta-sep" style={{ marginLeft: "auto" }}>·</span>
                  <Link
                    href={`/productions/${slug}/calls/${callDisplay.id}/edit`}
                    style={{ color: "rgba(255,255,255,.45)", fontSize: 12, textDecoration: "none" }}
                  >
                    Edit call
                  </Link>
                </>
              )}
            </div>

            {/* Main row: date + time */}
            <div className="today-main">
              <div>
                <div className="today-weekday">{callDisplay.dayOfWeek}</div>
                <h1 className="today-headline">
                  {callDisplay.month} <em>{callDisplay.day}</em>
                </h1>
              </div>
              <div className="today-time">
                <div className="today-eyebrow" style={{ color: "rgba(255,255,255,.5)" }}>Call</div>
                {callDisplay.time ? (
                  <div className="today-clock">
                    {callDisplay.time} <em>{callDisplay.amPm}</em>
                  </div>
                ) : (
                  <div className="today-clock" style={{ color: "rgba(255,255,255,.3)", fontSize: "clamp(24px,4vw,36px)" }}>TBD</div>
                )}
                {callDisplay.endTime && (
                  <div className="today-til">until {callDisplay.endTime} {callDisplay.endAmPm}</div>
                )}
              </div>
            </div>

            {/* Stats row — only rendered if at least one field is present */}
            {(callDisplay.focus || callDisplay.castCalled || callDisplay.location || callDisplay.duration) && (
              <div className="today-stats">
                {callDisplay.focus && (
                  <div className="today-stat">
                    <div className="today-stat-label">Working</div>
                    <div className="today-stat-primary">{callDisplay.focus}</div>
                    {callDisplay.scenes && (
                      <div className="today-stat-sub">{callDisplay.scenes}</div>
                    )}
                  </div>
                )}
                {callDisplay.castCalled && (
                  <div className="today-stat">
                    <div className="today-stat-label">Cast called</div>
                    <div className="today-stat-primary">{callDisplay.castCalled}</div>
                  </div>
                )}
                {callDisplay.location && (
                  <div className="today-stat">
                    <div className="today-stat-label">
                      <MapPin style={{ display: "inline", width: 10, height: 10, marginRight: 3, verticalAlign: "middle" }} />
                      Location
                    </div>
                    <div className="today-stat-primary">{callDisplay.location}</div>
                  </div>
                )}
                {callDisplay.duration && (
                  <div className="today-stat">
                    <div className="today-stat-label">Duration</div>
                    <div className="today-stat-primary">{callDisplay.duration}</div>
                    {callDisplay.endTime && (
                      <div className="today-stat-sub">ending {callDisplay.endTime} {callDisplay.endAmPm}</div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Schedule breakdown */}
            {callDisplay.schedule && (
              <div style={{ borderTop: "1px solid rgba(255,255,255,.1)", paddingTop: 14 }}>
                <div className="today-stat-label" style={{ marginBottom: 8 }}>Schedule</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {callDisplay.schedule
                    .split("\n")
                    .map((l) => l.trim())
                    .filter(Boolean)
                    .map((line, i) => (
                      <div key={i} style={{ fontSize: 13, color: "rgba(255,255,255,.8)", fontFamily: "var(--font-mono)" }}>
                        {line}
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Action pills */}
            <div className="today-actions">
              {canCreateReports && (
                <Link href={`/productions/${slug}/reports/new`} className="btn-hero primary">
                  <Icon name="FileText" size={14} />
                  <span>File tonight&apos;s report</span>
                  <Icon name="ChevronRight" size={13} />
                </Link>
              )}
              {canViewBlocking && (
                <Link href={`/productions/${slug}/blocking`} className="btn-hero">
                  <Icon name="Layout" size={14} />
                  <span>Stage blocking</span>
                </Link>
              )}
              {canViewNotes && (
                <Link href={`/productions/${slug}/notes`} className="btn-hero">
                  <Icon name="PenLine" size={14} />
                  <span>My notes</span>
                </Link>
              )}
              <Link href={`/productions/${slug}/documents`} className="btn-hero">
                <Icon name="FolderOpen" size={14} />
                <span>Documents</span>
              </Link>
            </div>
          </div>
        </section>
      ) : (
        <div className="card card-pad" style={{ marginBottom: 16, textAlign: "center" }}>
          <p style={{ fontSize: 14, fontWeight: 500, color: "var(--ink-2)", marginBottom: 4 }}>
            No upcoming calls scheduled
          </p>
          <p style={{ fontSize: 13, color: "var(--ink-4)" }}>
            Schedule calls in advance — add details as they&apos;re confirmed.
          </p>
          {canCreateReports && (
            <Link href={`/productions/${slug}/calls`} className="btn" style={{ display: "inline-flex", marginTop: 12 }}>
              Open call schedule
            </Link>
          )}
        </div>
      )}

      {/* ── Supporting row ── */}
      <div className="prod-overview-supporting" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
        {/* Recent activity */}
        <div className="card">
          <div className="card-pad row-between" style={{ paddingBottom: 8 }}>
            <h3 className="h-card">Recent activity</h3>
            <Link
              href={`/productions/${slug}/reports`}
              className="btn ghost"
              style={{ height: 26, padding: "0 8px", fontSize: 12 }}
            >
              View all
            </Link>
          </div>
          {activity.length === 0 ? (
            <div style={{ padding: "28px 20px", textAlign: "center", fontSize: 13, color: "var(--ink-4)", borderTop: "1px solid var(--border)" }}>
              No activity yet — file the first report to get started.
            </div>
          ) : (
            <div style={{ padding: "4px 0 12px" }}>
              {activity.map((item) => (
                <Link key={item.id} href={item.href} style={{ textDecoration: "none" }}>
                  <div
                    style={{
                      padding: "10px 20px",
                      display: "grid",
                      gridTemplateColumns: "28px 1fr auto",
                      gap: 12,
                      alignItems: "center",
                      borderTop: "1px solid var(--border)",
                    }}
                    className="hover-bg"
                  >
                    <div className="notif-ico" data-c={ACTIVITY_COLOR[item.kind]}>
                      {item.kind === "report" && <Icon name="FileText" size={14} />}
                      {item.kind === "document" && <Icon name="FolderOpen" size={14} />}
                      {item.kind === "announcement" && <Icon name="Megaphone" size={14} />}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {item.title}
                      </div>
                      <div className="muted" style={{ fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {item.subtitle}
                      </div>
                    </div>
                    <span className="muted" style={{ fontSize: 11.5, whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
                      {relativeTime(item.createdAt)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Principals / Team */}
        <div className="card card-pad">
          <div className="row-between" style={{ marginBottom: 12 }}>
            <h3 className="h-card">{principals.length > 0 ? "Principals" : "Team"}</h3>
            <div className="row" style={{ gap: 6 }}>
              <span style={{ fontSize: 11.5, color: "var(--ink-4)" }}>
                {Math.min(teamList.length, 10)} of {members.length}
              </span>
              {canManage && (
                <Link
                  href={`/productions/${slug}/members`}
                  style={{ fontSize: 11.5, color: "var(--ink-4)", textDecoration: "none" }}
                >
                  Manage
                </Link>
              )}
            </div>
          </div>

          {members.length === 0 ? (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <Icon name="Users" style={{ width: 28, height: 28, color: "var(--ink-4)", margin: "0 auto 8px" }} />
              <p style={{ fontSize: 13, color: "var(--ink-4)" }}>
                {canManage ? "Assign team members to this production." : "No team members assigned yet."}
              </p>
              {canManage && (
                <Link href={`/productions/${slug}/members`} className="btn ghost" style={{ display: "inline-flex", marginTop: 10, fontSize: 12 }}>
                  Manage team
                </Link>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {teamList.slice(0, 10).map((member) => {
                const name = memberDisplayName(member.firstName, member.lastName, member.email);
                const initials = memberInitials(member.firstName, member.lastName, member.email);
                const color = avatarColor(name);
                const badge = member.characterName ? "Principal" : (ROLE_LABELS[member.role] ?? member.role);

                return (
                  <div key={member.id} className="row" style={{ gap: 10 }}>
                    <div
                      className="avatar"
                      style={{ background: `var(--c-${color})`, width: 26, height: 26, fontSize: 11 }}
                    >
                      {initials}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {member.characterName ?? name}
                      </div>
                      {member.characterName && (
                        <div className="muted" style={{ fontSize: 11.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {name}
                        </div>
                      )}
                    </div>
                    <span className="pill" data-c={color}>{badge}</span>
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
