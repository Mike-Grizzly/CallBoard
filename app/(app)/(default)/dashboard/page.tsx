import Link from "next/link";
import { ChevronRight, Plus } from "lucide-react";
import { requireCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getUserProductions } from "@/features/productions/queries";
import { getAnnouncementsForUser } from "@/features/announcements/queries";
import { getNextCallsForProductions } from "@/features/calls/queries";
import { getMentionsForUser } from "@/features/mentions/queries";
import { getPinsForUser } from "@/features/pins/queries";
import {
  DashboardAnnouncements,
  type SerializedAnnouncement,
} from "./dashboard-announcements";
import { MentionsSection, type SerializedMention } from "./mentions-section";
import { PinnedSection } from "./pinned-section";
import { MobileTodayHero, type NextCallSummary } from "./mobile-today-hero";

// Deterministic color per production — same palette as the left rail
const PROD_COLORS = [
  "var(--c-clay)",
  "var(--c-sage)",
  "var(--c-dusk)",
  "var(--c-amber)",
  "var(--c-plum)",
  "var(--c-sand)",
];
function prodColor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return PROD_COLORS[h % PROD_COLORS.length];
}

function getGreeting(hour: number): string {
  if (hour < 5) return "Working late";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function roleLabel(role: string): string {
  const labels: Record<string, string> = {
    admin: "Admin",
    producer: "Producer",
    director: "Director",
    stage_manager: "Stage Manager",
    cast: "Cast",
    crew: "Crew",
    choreographer: "Choreographer",
  };
  return labels[role] ?? role;
}

function formatOpeningDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatCallDate(
  callDate: string,
  today: string,
  tomorrow: string,
): string {
  if (callDate === today) return "Today";
  if (callDate === tomorrow) return "Tomorrow";
  return new Date(callDate + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatCallTime(time: string | null | undefined): string {
  if (!time) return "";
  const [hh, mm] = time.split(":");
  const h = parseInt(hh, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${mm} ${ampm}`;
}

function formatRelativeTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (mins < 2) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function stripHtml(html: string | null): string {
  if (!html) return "";
  return html.replace(/<[^>]+>/g, "").trim();
}

export default async function DashboardPage() {
  const user = await requireCurrentUser();
  const canManage = can(user.role, "productions:manage");

  const myProductions = await getUserProductions(user.id);
  const prodIds = myProductions.map((p) => p.id);

  const [announcements, nextCallMap, mentionRows, pins] = await Promise.all([
    getAnnouncementsForUser(user.id, user.organizationId, canManage),
    getNextCallsForProductions(prodIds),
    getMentionsForUser(user.id),
    getPinsForUser(user.id),
  ]);

  const now = new Date();
  const hour = now.getHours();
  const today = now.toISOString().split("T")[0];
  const tomorrowDate = new Date(now);
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrow = tomorrowDate.toISOString().split("T")[0];

  const greeting = getGreeting(hour);
  const firstName = user.firstName || "";
  const todayLabel = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  // Earliest upcoming call across all productions
  const allNextCalls = Object.values(nextCallMap).filter(Boolean);
  allNextCalls.sort((a, b) => {
    const aKey = `${a!.callDate}${a!.callTime ?? ""}`;
    const bKey = `${b!.callDate}${b!.callTime ?? ""}`;
    return aKey.localeCompare(bKey);
  });
  const earliestCall = allNextCalls[0] ?? null;

  const pinnedCount = announcements.filter((a) => a.pinned).length;
  const unreadMentionCount = mentionRows.filter((m) => !m.readAt).length;

  // Mobile Today hero — pre-format the next call summary for the phone
  // layout. Rendered inside the same `.page-narrow.home` container and
  // CSS-gated to phone widths.
  const earliestCallProduction = earliestCall
    ? myProductions.find((p) => p.id === earliestCall.productionId)
    : null;
  const nextCallSummary: NextCallSummary | null =
    earliestCall && earliestCallProduction
      ? {
          productionTitle: earliestCallProduction.title,
          productionSlug: earliestCallProduction.slug,
          dateLabel: formatCallDate(earliestCall.callDate, today, tomorrow),
          isToday: earliestCall.callDate === today,
          isTomorrow: earliestCall.callDate === tomorrow,
          callTime: earliestCall.callTime
            ? formatCallTime(earliestCall.callTime)
            : null,
          endTime: earliestCall.endTime
            ? formatCallTime(earliestCall.endTime)
            : null,
          location: earliestCall.location,
          focus: earliestCall.focus,
        }
      : null;

  // Serialize announcements for client component (Date → string)
  const serializedAnnouncements: SerializedAnnouncement[] = announcements
    .slice(0, 10)
    .map((a) => ({
      id: a.id,
      title: a.title,
      body: stripHtml(a.body),
      pinned: a.pinned,
      productionId: a.productionId,
      productionTitle: a.productionTitle,
      authorName:
        [a.authorFirstName, a.authorLastName].filter(Boolean).join(" ") ||
        a.authorEmail,
      relativeTime: formatRelativeTime(a.createdAt),
      isOrgWide: !a.productionId,
      railColor: (a.pinned ? "amber" : !a.productionId ? "dusk" : "sage") as
        | "amber"
        | "dusk"
        | "sage",
    }));

  // Serialize mentions for client component
  const serializedMentions: SerializedMention[] = mentionRows.map((m) => {
    const fromName =
      [m.fromFirstName, m.fromLastName].filter(Boolean).join(" ") ||
      m.fromEmail;
    const parts = fromName.trim().split(" ");
    const initials =
      parts.length >= 2
        ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
        : fromName.slice(0, 2).toUpperCase();

    let href = "";
    if (m.productionSlug) {
      if (m.contextType === "report")
        href = `/productions/${m.productionSlug}/reports/${m.contextId}`;
      else if (m.contextType === "note")
        href = `/productions/${m.productionSlug}/notes`;
      else if (m.contextType === "announcement")
        href = `/productions/${m.productionSlug}/announcements`;
      else
        href = `/productions/${m.productionSlug}`;
    }

    return {
      id: m.id,
      contextType: m.contextType,
      contextId: m.contextId,
      contextTitle: m.contextTitle,
      snippet: m.snippet,
      isUnread: !m.readAt,
      fromName,
      fromInitials: initials,
      fromColor: "",
      productionTitle: m.productionTitle,
      productionSlug: m.productionSlug,
      relativeTime: formatRelativeTime(m.createdAt),
      href,
    };
  });

  return (
    <div className="page-narrow home">
      {/* ── Mobile Today hero (phone widths only) ────────────────────── */}
      <MobileTodayHero
        greeting={greeting}
        firstName={firstName}
        todayLabel={todayLabel}
        productionsCount={myProductions.length}
        unreadMentionCount={unreadMentionCount}
        pinnedCount={pinnedCount}
        nextCall={nextCallSummary}
      />

      {/* ── Desktop hero (hidden at phone widths) ────────────────────── */}
      <section className="home-hero">
        <div className="home-hero-meta">
          <span className="home-hero-eyebrow">
            Workspace · {roleLabel(user.role)}
          </span>
          <span className="home-hero-sep">·</span>
          <span>{todayLabel}</span>
        </div>
        <h1 className="home-hero-title">
          {greeting}
          {firstName ? (
            <>
              , <em>{firstName}</em>
            </>
          ) : null}
          .
        </h1>
        <p className="home-hero-sub">
          {myProductions.length === 0 ? (
            canManage ? (
              "Your workspace is ready. Create your first production to start tracking rehearsals, calls, and documents."
            ) : (
              "No productions assigned to you yet — sit tight while your team gets set up."
            )
          ) : (
            <>
              <b>
                {myProductions.length} production
                {myProductions.length !== 1 ? "s" : ""}
              </b>{" "}
              on your plate
              {unreadMentionCount > 0 && (
                <>
                  {" "}
                  ·{" "}
                  <b>
                    {unreadMentionCount} unread mention
                    {unreadMentionCount !== 1 ? "s" : ""}
                  </b>
                </>
              )}
              {pinnedCount > 0 && (
                <>
                  {" "}
                  ·{" "}
                  <b>
                    {pinnedCount} pinned announcement
                    {pinnedCount !== 1 ? "s" : ""}
                  </b>
                </>
              )}
              {earliestCall ? (
                <>
                  {" "}
                  · next call{" "}
                  <b>
                    {formatCallDate(earliestCall.callDate, today, tomorrow)}
                    {earliestCall.callTime
                      ? ` at ${formatCallTime(earliestCall.callTime)}`
                      : ""}
                  </b>
                </>
              ) : (
                <> · no upcoming calls</>
              )}
            </>
          )}
        </p>
      </section>

      {/* ── Right Now (desktop-only — mobile shows the call card above) ── */}
      {myProductions.length > 0 && (
        <section className="home-section dashboard-desktop-only">
          <header className="home-section-head">
            <div>
              <div className="h-eyebrow">Schedule</div>
              <h2 className="h-section">Upcoming rehearsals &amp; calls</h2>
            </div>
          </header>
          <div className="right-now-grid">
            {myProductions.map((p) => {
              const call = nextCallMap[p.id];
              const color = prodColor(p.id);

              let urgency: "hot" | "warm" | "cold" = "cold";
              let when = "No upcoming calls";
              let what =
                p.status === "archived" ? "Archived" : "Nothing scheduled";
              let where = "—";

              if (call) {
                urgency = call.callDate === today ? "hot" : "warm";
                const dateLabel = formatCallDate(call.callDate, today, tomorrow);
                const timeLabel = call.callTime
                  ? formatCallTime(call.callTime)
                  : "";
                when = timeLabel ? `${dateLabel} · ${timeLabel}` : dateLabel;
                what = call.focus ?? "Rehearsal";
                where = call.location ?? "—";
              }

              return (
                <Link
                  key={p.id}
                  href={`/productions/${p.slug}`}
                  className="rn-card"
                  data-u={urgency}
                >
                  <div className="rn-spine" style={{ background: color }} />
                  <div className="rn-prod">
                    <span className="rn-prod-name">{p.title}</span>
                    <span className="rn-role">{roleLabel(p.role)}</span>
                  </div>
                  <div className="rn-when">{when}</div>
                  <div className="rn-what">{what}</div>
                  <div className="rn-foot">
                    <span>{where}</span>
                    {call?.castCalled && (
                      <>
                        <span className="rn-pip" />
                        <span className="mono">{call.castCalled}</span>
                      </>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Announcements ────────────────────────────────────────────── */}
      {serializedAnnouncements.length > 0 && (
        <DashboardAnnouncements items={serializedAnnouncements} />
      )}

      {/* ── Productions browser ──────────────────────────────────────── */}
      <section className="home-section">
        <header className="home-section-head">
          <div>
            <div className="h-eyebrow">Productions</div>
            <h2 className="h-section">Your shows</h2>
          </div>
          {canManage && myProductions.length > 0 && (
            <Link
              href="/productions/new"
              className="btn"
              style={{ height: 28, padding: "0 10px", fontSize: 12 }}
            >
              <Plus size={12} aria-hidden /> New production
            </Link>
          )}
        </header>

        {myProductions.length === 0 ? (
          canManage ? (
            <div
              className="card card-pad"
              style={{
                textAlign: "center",
                padding: "40px 28px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 10,
              }}
            >
              <div
                aria-hidden
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: "var(--bg-muted)",
                  display: "grid",
                  placeItems: "center",
                  color: "var(--ink-3)",
                  marginBottom: 4,
                }}
              >
                <Plus size={22} strokeWidth={1.75} />
              </div>
              <h3
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: "var(--ink-1)",
                  margin: 0,
                }}
              >
                Create your first production
              </h3>
              <p
                className="muted"
                style={{
                  fontSize: 13,
                  maxWidth: 420,
                  lineHeight: 1.45,
                  margin: 0,
                }}
              >
                Every show your company is producing lives in its own hub —
                rehearsal reports, blocking, script, calls, and documents all
                in one place. Spin up your first one to get going.
              </p>
              <Link
                href="/productions/new"
                className="btn primary"
                style={{ marginTop: 6 }}
              >
                <Plus size={14} aria-hidden /> New production
              </Link>
            </div>
          ) : (
            <p style={{ fontSize: 13, color: "var(--ink-3)" }}>
              You haven&apos;t been assigned to any productions yet.
            </p>
          )
        ) : (
          <div className="prod-cards">
            {myProductions.map((p) => {
              const color = prodColor(p.id);
              const call = nextCallMap[p.id];
              const nextLabel = call
                ? formatCallDate(call.callDate, today, tomorrow)
                : "—";
              const hasNext = !!call;

              return (
                <Link
                  key={p.id}
                  href={`/productions/${p.slug}`}
                  className="prod-card"
                  data-status={p.status}
                >
                  <div className="prod-card-head">
                    <span className="prod-card-status">
                      <span
                        className="prod-card-dot"
                        style={{ background: color }}
                      />
                      {p.status}
                    </span>
                  </div>
                  <h3 className="prod-card-title">{p.title}</h3>
                  <div className="prod-card-foot">
                    <div>
                      <div className="prod-card-foot-label">My role</div>
                      <div className="prod-card-foot-val">
                        {roleLabel(p.role)}
                      </div>
                    </div>
                    <div>
                      <div className="prod-card-foot-label">Opens</div>
                      <div className="prod-card-foot-val">
                        {formatOpeningDate(p.openingDate)}
                      </div>
                    </div>
                    <div>
                      <div className="prod-card-foot-label">Next call</div>
                      <div
                        className={
                          hasNext
                            ? "prod-card-foot-val prod-card-next"
                            : "prod-card-foot-val"
                        }
                      >
                        {nextLabel}
                      </div>
                    </div>
                  </div>
                  <div className="prod-card-cta">
                    Open hub{" "}
                    <ChevronRight size={14} strokeWidth={2} aria-hidden />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* ── @Mentions ────────────────────────────────────────────────── */}
      {serializedMentions.length > 0 && (
        <MentionsSection items={serializedMentions} />
      )}

      {/* ── Pinned ───────────────────────────────────────────────────── */}
      <PinnedSection pins={pins} />
    </div>
  );
}
