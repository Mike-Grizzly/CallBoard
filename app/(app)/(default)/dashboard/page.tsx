import Link from "next/link";
import {
  ChevronRight,
  Plus,
  Hash,
  Bell,
  Layers,
  CalendarDays,
  Pin,
  FileText,
  File,
  Pencil,
  CheckSquare,
} from "lucide-react";
import { requireCurrentUser, markActiveAndGetPrevious } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getVisibleProductions } from "@/features/productions/queries";
import {
  getAnnouncementsForUser,
  getAckInfoForAnnouncements,
  announcementScope,
} from "@/features/announcements/queries";
import {
  getNextCallsForProductions,
  getCallsForUserInRange,
  getCallConfirmSummary,
} from "@/features/calls/queries";
import { getMentionsForUser } from "@/features/mentions/queries";
import { hasNotificationPreferences } from "@/features/notifications/preferences";
import { getPinsForUser, type PinRow } from "@/features/pins/queries";
import { getCastForProductions } from "@/features/members/queries";
import { type SerializedAnnouncement } from "./dashboard-announcements";
import { type SerializedMention } from "./mentions-section";
import { FocalCall, type FocalAvatar } from "./focal-call";
import { BentoMentions } from "./bento-mentions";
import { AnnouncementAckButton } from "./announcement-ack-button";
import {
  MobileDashboard,
  type MdShow,
  type MdAnnouncement,
  type MdPin,
  type MdTimelineItem,
} from "./mobile-dashboard";
import { OnboardingDialog } from "./onboarding-dialog";

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
function colorForName(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return PROD_COLORS[h % PROD_COLORS.length];
}
function initialsOf(
  first: string | null,
  last: string | null,
  email?: string,
): string {
  const f = (first ?? "").trim();
  const l = (last ?? "").trim();
  if (f || l) return `${f[0] ?? ""}${l[0] ?? ""}`.toUpperCase() || "?";
  return (email ?? "?").slice(0, 2).toUpperCase();
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

// Greeting. `greeting` is rendered as `{greeting}, {firstName}.`, so every
// phrase reads naturally with a name appended; the optional `note` is a short
// follow-up line shown beneath it. Theatre-aware: milestones from the
// production calendar take priority over a plain time-of-day hello.
type Greeting = { greeting: string; note?: string };

function getContextualGreeting(opts: {
  hour: number;
  today: string;
  productions: {
    status: string;
    openingDate: string | null;
    closingDate: string | null;
    firstRehearsalDate: string | null;
    techStartDate: string | null;
  }[];
  hasCallToday: boolean;
  /** Whole days since the user's previous visit; null for new/first visit. */
  daysAway: number | null;
}): Greeting {
  const active = opts.productions.filter((p) => p.status !== "archived");
  const isToday = (d: string | null) => !!d && d === opts.today;

  // Exact-day milestones first (most specific).

  // Opening night.
  if (active.some((p) => isToday(p.openingDate))) {
    return { greeting: "Break a leg" };
  }

  // Closing / last show.
  if (active.some((p) => isToday(p.closingDate))) {
    return { greeting: "Congratulations", note: "See you on the next one." };
  }

  // First day of rehearsal.
  if (active.some((p) => isToday(p.firstRehearsalDate))) {
    return { greeting: "First day of rehearsal" };
  }

  // Tech week — today falls in [techStart, opening); if no opening date is set,
  // cap the window at two weeks so it can't run forever.
  const inTech = active.some((p) => {
    if (!p.techStartDate || opts.today < p.techStartDate) return false;
    const end = p.openingDate ?? addDays(p.techStartDate, 14);
    return opts.today < end;
  });
  if (inTech) return { greeting: "Welcome to tech week" };

  // A call is on the calendar today.
  if (opts.hasCallToday) return { greeting: "Ready for rehearsal" };

  // Returning after a day or more away (and no milestone above stole the show).
  if (opts.daysAway !== null && opts.daysAway >= 1) {
    return { greeting: "Welcome back" };
  }

  // Day off — inside an active production's run/rehearsal window, but nothing
  // scheduled today. (Outside any active window, fall through to time-of-day.)
  const onBreak = active.some((p) => {
    if (!p.firstRehearsalDate || opts.today < p.firstRehearsalDate) return false;
    const end = p.closingDate ?? p.openingDate;
    return !!end && opts.today <= end;
  });
  if (onBreak) return { greeting: "Enjoy your day off" };

  // Plain time-of-day default.
  if (opts.hour < 5) return { greeting: "Working late" };
  if (opts.hour < 12) return { greeting: "Good morning" };
  if (opts.hour < 17) return { greeting: "Good afternoon" };
  return { greeting: "Good evening" };
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

function formatCallDate(callDate: string, today: string, tomorrow: string): string {
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

// Week-toward-opening progress for a show tile.
function progressToOpening(
  p: { status: string; firstRehearsalDate: string | null; openingDate: string | null },
  todayMs: number,
): { label: string; value: string; pct: number; opens: string } {
  const opens = p.openingDate ? formatOpeningDate(p.openingDate) : "TBD";
  if (p.status === "archived") {
    return { label: "Run complete", value: "Closed", pct: 100, opens: "Closed" };
  }
  if (p.firstRehearsalDate && p.openingDate) {
    const start = new Date(p.firstRehearsalDate + "T00:00:00").getTime();
    const end = new Date(p.openingDate + "T00:00:00").getTime();
    if (end > start) {
      const totalWeeks = Math.max(1, Math.ceil((end - start) / 6.048e8));
      const elapsed = (todayMs - start) / 6.048e8;
      const week = Math.min(totalWeeks, Math.max(1, Math.ceil(elapsed)));
      const pct = Math.min(100, Math.max(0, Math.round((elapsed / ((end - start) / 6.048e8)) * 100)));
      return {
        label: "Toward opening",
        value: `Week ${week} of ${totalWeeks}`,
        pct,
        opens,
      };
    }
  }
  return { label: "Opening", value: opens === "TBD" ? "Date TBD" : opens, pct: 0, opens };
}

export default async function DashboardPage() {
  const user = await requireCurrentUser();
  const canManage = can(user.role, "productions:manage");

  // Stamp this visit and learn how long they were away (for "Welcome back").
  const lastActiveAt = await markActiveAndGetPrevious(user.id);

  const myProductions = await getVisibleProductions(user);
  const prodIds = myProductions.map((p) => p.id);

  const now = new Date();
  const todayMs = now.getTime();
  const today = now.toISOString().split("T")[0];
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const tomorrowDate = new Date(now);
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrow = tomorrowDate.toISOString().split("T")[0];
  const weekEndDate = new Date(now);
  weekEndDate.setDate(weekEndDate.getDate() + 13);
  const weekEnd = weekEndDate.toISOString().split("T")[0];

  const [
    announcements,
    nextCallMap,
    mentionRows,
    pins,
    castMap,
    rangeCalls,
    hasNotifPrefs,
  ] = await Promise.all([
    getAnnouncementsForUser(user.id, user.organizationId, canManage),
    getNextCallsForProductions(prodIds),
    getMentionsForUser(user.id),
    getPinsForUser(user.id),
    getCastForProductions(prodIds),
    getCallsForUserInRange({
      userId: user.id,
      organizationId: user.organizationId,
      startDate: today,
      endDate: weekEnd,
      manageAll: canManage,
    }),
    hasNotificationPreferences(user.id),
  ]);

  const daysAway = lastActiveAt
    ? Math.floor((todayMs - lastActiveAt.getTime()) / 86_400_000)
    : null;
  const { greeting, note: greetingNote } = getContextualGreeting({
    hour: now.getHours(),
    today,
    productions: myProductions,
    hasCallToday: rangeCalls.some((c) => c.callDate === today),
    daysAway,
  });
  const firstName = user.firstName || "";
  const todayLabel = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  // Earliest upcoming call across all productions = the focal call
  const allNextCalls = Object.values(nextCallMap).filter(Boolean);
  allNextCalls.sort((a, b) => {
    const aKey = `${a!.callDate}${a!.callTime ?? ""}`;
    const bKey = `${b!.callDate}${b!.callTime ?? ""}`;
    return aKey.localeCompare(bKey);
  });
  const earliestCall = allNextCalls[0] ?? null;
  const earliestProd = earliestCall
    ? myProductions.find((p) => p.id === earliestCall.productionId)
    : null;

  // Confirmation rollup for the focal call
  const focalConfirm =
    earliestCall && earliestProd
      ? await getCallConfirmSummary(
          earliestCall.id,
          earliestCall.productionId,
          user.id,
        )
      : null;

  const unreadMentionCount = mentionRows.filter((m) => !m.readAt).length;
  const activeShows = myProductions.filter((p) => p.status !== "archived").length;

  // Unread mentions per production (for show-tile badges)
  const unreadByProd: Record<string, number> = {};
  for (const m of mentionRows) {
    if (!m.readAt && m.productionId) {
      unreadByProd[m.productionId] = (unreadByProd[m.productionId] ?? 0) + 1;
    }
  }

  // Today's timeline + "more this week" count
  const todaysCalls = rangeCalls
    .filter((c) => c.callDate === today)
    .sort((a, b) => (a.callTime ?? "").localeCompare(b.callTime ?? ""));
  const moreThisWeek = rangeCalls.filter((c) => c.callDate > today).length;
  const nextThisWeek = rangeCalls.find((c) => c.callDate > today) ?? null;
  function callState(c: { callTime: string | null; endTime: string | null }) {
    if (c.endTime && c.endTime <= currentTime) return "done";
    if ((!c.callTime || c.callTime <= currentTime) && (!c.endTime || c.endTime > currentTime))
      return "now";
    return "up";
  }

  // Serialize announcements (Date → string) for the client list + ack info
  const ackInfo = await getAckInfoForAnnouncements(
    announcements.slice(0, 10).map((a) => a.id),
    user.id,
    user.organizationId,
  );
  const serializedAnnouncements: SerializedAnnouncement[] = announcements
    .slice(0, 10)
    .map((a) => {
      const scope = announcementScope(a.orgWide, a.targets.length);
      const scopeLabel =
        scope === "org"
          ? "All productions"
          : scope === "multi"
            ? `${a.targets.length} productions`
            : (a.targets[0]?.title ?? "Production");
      return {
        id: a.id,
        title: a.title,
        body: stripHtml(a.body),
        pinned: a.pinned,
        scope,
        scopeLabel,
        priority: a.priority as "normal" | "important" | "urgent",
        authorName:
          [a.authorFirstName, a.authorLastName].filter(Boolean).join(" ") ||
          a.authorEmail,
        relativeTime: formatRelativeTime(a.createdAt),
        railColor: (a.pinned
          ? "amber"
          : scope === "org"
            ? "dusk"
            : "sage") as "amber" | "dusk" | "sage",
      };
    });

  // Serialize mentions
  const serializedMentions: SerializedMention[] = mentionRows.map((m) => {
    const fromName =
      [m.fromFirstName, m.fromLastName].filter(Boolean).join(" ") || m.fromEmail;
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
      else if (m.contextType === "blocking")
        href = m.beatId
          ? `/productions/${m.productionSlug}/blocking?beat=${m.beatId}`
          : `/productions/${m.productionSlug}/blocking`;
      else href = `/productions/${m.productionSlug}`;
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
  // Surface unread mentions first so they're never hidden behind read ones in
  // the capped dashboard lists (stable sort preserves recency within a group).
  serializedMentions.sort((a, b) => Number(b.isUnread) - Number(a.isUnread));

  // Focal call props
  const focalProps =
    earliestCall && earliestProd && focalConfirm
      ? (() => {
          const where = [earliestCall.location, earliestProd.venue].filter(
            (x): x is string => !!x,
          );
          const startIso =
            earliestCall.callTime
              ? `${earliestCall.callDate}T${earliestCall.callTime}:00`
              : null;
          const dateLabel = formatCallDate(earliestCall.callDate, today, tomorrow);
          const times = [
            earliestCall.callTime ? formatCallTime(earliestCall.callTime) : null,
            earliestCall.endTime ? formatCallTime(earliestCall.endTime) : null,
          ].filter(Boolean);
          const whenLabel = times.length
            ? `${dateLabel} · ${times.join(" – ")}`
            : dateLabel;
          const confirmedAvatars: FocalAvatar[] = focalConfirm.confirmedMembers.map(
            (m) => ({
              initials: initialsOf(m.firstName, m.lastName),
              color: colorForName(`${m.firstName ?? ""}${m.lastName ?? ""}${m.userId}`),
            }),
          );
          return {
            callId: earliestCall.id,
            title: earliestCall.focus || "Rehearsal",
            whenLabel,
            startIso,
            isLive: earliestCall.isLive,
            where,
            productionTitle: earliestProd.title,
            productionColorVar: prodColor(earliestProd.id),
            callsHref: `/productions/${earliestProd.slug}/calls`,
            scriptHref: `/productions/${earliestProd.slug}/script`,
            called: focalConfirm.called,
            confirmed: focalConfirm.confirmed,
            confirmedAvatars,
            isMember: focalConfirm.isMember,
            myConfirmed: focalConfirm.myStatus === "confirmed",
          };
        })()
      : null;

  // ── Mobile dashboard data (phone widths only) ──────────────────────
  const mdTimeline: MdTimelineItem[] = todaysCalls.map((c) => ({
    id: c.id,
    time: formatCallTime(c.callTime) || "—",
    what: c.focus || "Rehearsal",
    sub: [c.productionTitle, c.location].filter(Boolean).join(" · "),
    state: callState(c),
  }));
  const mdMoreThisWeek =
    moreThisWeek > 0 && nextThisWeek
      ? `${moreThisWeek} more this week · next ${formatCallDate(nextThisWeek.callDate, today, tomorrow)}${nextThisWeek.callTime ? " " + formatCallTime(nextThisWeek.callTime) : ""}`
      : null;
  const mdShows: MdShow[] = myProductions.map((p) => {
    const prog = progressToOpening(p, todayMs);
    const cast = castMap[p.id] ?? [];
    const call = nextCallMap[p.id];
    return {
      id: p.id,
      slug: p.slug,
      title: p.title,
      subtitle: [p.venue, roleLabel(p.role)].filter(Boolean).join(" · "),
      status: p.status,
      color: prodColor(p.id),
      unread: unreadByProd[p.id] ?? 0,
      progLabel: p.status === "archived" ? "Closed" : prog.value,
      opens: prog.opens,
      pct: prog.pct,
      principals: cast.slice(0, 3).map((c) => ({
        initials: initialsOf(c.firstName, c.lastName),
        color: colorForName(`${c.firstName ?? ""}${c.lastName ?? ""}${c.userId}`),
      })),
      extraPrincipals: Math.max(0, cast.length - 3),
      next: call
        ? `${formatCallDate(call.callDate, today, tomorrow)}${call.callTime ? " " + formatCallTime(call.callTime) : ""}`
        : "—",
    };
  });
  const mdAnnouncements: MdAnnouncement[] = serializedAnnouncements.map((a) => ({
    ...a,
    ack: ackInfo[a.id] ?? null,
  }));
  const mdPins: MdPin[] = pins.map((pin) => ({
    id: pin.pinId,
    title: pin.title,
    meta: pin.productionTitle,
    href: pinHref(pin),
    kind:
      pin.itemType === "note" && pin.subtype === "todo" ? "todo" : pin.itemType,
  }));

  return (
    <div className="page-narrow home">
      {!hasNotifPrefs && <OnboardingDialog />}

      {/* ════════════════════════════════════════════════════════════════
          DESKTOP COMMAND CENTER (hidden at phone widths)
          ════════════════════════════════════════════════════════════════ */}
      <div className="dd-wrap dashboard-desktop-only">
        {/* Greeting band + status chips */}
        <header className="dd-greet">
          <div>
            <div className="dd-greet-meta">
              <span className="dd-greet-eyebrow">
                Workspace · {roleLabel(user.role)}
              </span>
              <span className="dd-greet-sep">·</span>
              <span>{todayLabel}</span>
            </div>
            <h1>
              {greeting}
              {firstName ? (
                <>
                  , <em>{firstName}</em>
                </>
              ) : null}
              .
            </h1>
            {greetingNote && (
              <p
                className="muted"
                style={{ marginTop: 4, fontSize: 14 }}
              >
                {greetingNote}
              </p>
            )}
          </div>
          <div className="dd-chips">
            <div className="dd-chip" data-tone="accent">
              <div className="dd-chip-ico">
                <Hash size={15} aria-hidden />
              </div>
              <div>
                <div className="dd-chip-num">{unreadMentionCount}</div>
                <div className="dd-chip-lbl">
                  new mention{unreadMentionCount !== 1 ? "s" : ""}
                </div>
              </div>
            </div>
            <div className="dd-chip" data-tone="amber">
              <div className="dd-chip-ico">
                <Bell size={15} aria-hidden />
              </div>
              <div>
                <div className="dd-chip-num">{announcements.length}</div>
                <div className="dd-chip-lbl">
                  announcement{announcements.length !== 1 ? "s" : ""}
                </div>
              </div>
            </div>
            <div className="dd-chip">
              <div className="dd-chip-ico">
                <Layers size={15} aria-hidden />
              </div>
              <div>
                <div className="dd-chip-num">{activeShows}</div>
                <div className="dd-chip-lbl">active shows</div>
              </div>
            </div>
          </div>
        </header>

        {/* Hero row: focal call + today timeline */}
        {(focalProps || todaysCalls.length > 0) && (
          <section className="dd-hero-row">
            {focalProps ? (
              <FocalCall {...focalProps} />
            ) : (
              <article className="dd-focal dd-focal-empty">
                <div className="dd-focal-body">
                  <h2 className="dd-focal-title">No upcoming calls</h2>
                  <div className="dd-focal-where">
                    Schedule a rehearsal to see it here.
                  </div>
                </div>
              </article>
            )}

            <aside className="dd-timeline">
              <div className="dd-tl-head">
                <span className="dd-tl-title">Today</span>
                <span className="dd-tl-date mono">
                  {now.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              </div>
              <div className="dd-tl-list">
                {todaysCalls.length === 0 ? (
                  <div className="dd-tl-empty">Nothing on the calendar today.</div>
                ) : (
                  todaysCalls.map((c) => {
                    const state = callState(c);
                    return (
                      <div key={c.id} className="dd-tl-item" data-state={state}>
                        <span className="dd-tl-time mono">
                          {formatCallTime(c.callTime) || "—"}
                        </span>
                        <span className="dd-tl-node" />
                        <div>
                          <div className="dd-tl-what">
                            {c.focus || "Rehearsal"}
                            {state === "now" && (
                              <span className="dd-tl-now-tag">NOW</span>
                            )}
                          </div>
                          <div className="dd-tl-sub">
                            {[c.productionTitle, c.location]
                              .filter(Boolean)
                              .join(" · ")}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              <div className="dd-tl-foot">
                <CalendarDays size={13} aria-hidden />
                {moreThisWeek > 0 && nextThisWeek ? (
                  <span>
                    <b>
                      {moreThisWeek} more
                    </b>{" "}
                    this week · next {formatCallDate(nextThisWeek.callDate, today, tomorrow)}
                    {nextThisWeek.callTime
                      ? ` ${formatCallTime(nextThisWeek.callTime)}`
                      : ""}
                  </span>
                ) : (
                  <span>No more calls scheduled this week.</span>
                )}
              </div>
            </aside>
          </section>
        )}

        {/* Your shows */}
        <section>
          <div className="dd-head">
            <div>
              <div className="dd-eyebrow">Your shows</div>
              <h2 className="dd-h2">
                {myProductions.length === 0
                  ? "No productions yet"
                  : `${myProductions.length} production${myProductions.length !== 1 ? "s" : ""} on your desk`}
              </h2>
            </div>
            <Link href="/productions" className="dd-link">
              All productions <ChevronRight size={13} aria-hidden />
            </Link>
          </div>
          <div className="dd-shows">
            {myProductions.map((p) => {
              const color = prodColor(p.id);
              const prog = progressToOpening(p, todayMs);
              const cast = castMap[p.id] ?? [];
              const call = nextCallMap[p.id];
              const unread = unreadByProd[p.id] ?? 0;
              const nextLabel = call
                ? `${formatCallDate(call.callDate, today, tomorrow)}${call.callTime ? " · " + formatCallTime(call.callTime) : ""}`
                : "—";
              return (
                <Link
                  key={p.id}
                  href={`/productions/${p.slug}`}
                  className="dd-show"
                  data-status={p.status}
                >
                  <div className="dd-show-band" style={{ background: color }} />
                  <div className="dd-show-in">
                    <div className="dd-show-top">
                      <span className="dd-show-status">
                        <span
                          className="dd-prod-dot"
                          style={{ background: color, width: 8, height: 8 }}
                        />
                        {p.status}
                      </span>
                      {unread > 0 && (
                        <span className="dd-show-unread">{unread} new</span>
                      )}
                    </div>
                    <div>
                      <h3 className="dd-show-title">{p.title}</h3>
                      <div className="dd-show-venue">
                        {[p.venue, roleLabel(p.role)].filter(Boolean).join(" · ")}
                      </div>
                    </div>
                    <div className="dd-prog">
                      <div className="dd-prog-top">
                        <span className="lbl">{prog.label}</span>
                        <span className="val">{prog.value}</span>
                      </div>
                      <div className="dd-prog-track">
                        <div
                          className="dd-prog-fill"
                          style={{
                            width: `${prog.pct}%`,
                            background: p.status === "archived" ? "var(--ink-4)" : color,
                          }}
                        />
                      </div>
                      <div className="dd-prog-ticks">
                        <span>Cast</span>
                        <span>Opens {prog.opens}</span>
                      </div>
                    </div>
                    <div className="dd-show-foot">
                      <div className="dd-show-people">
                        {cast.length > 0 ? (
                          <>
                            {cast.slice(0, 4).map((c, i) => (
                              <div
                                key={i}
                                className="avatar"
                                style={{
                                  background: colorForName(
                                    `${c.firstName ?? ""}${c.lastName ?? ""}${c.userId}`,
                                  ),
                                }}
                                aria-hidden
                              >
                                {initialsOf(c.firstName, c.lastName)}
                              </div>
                            ))}
                            {cast.length > 4 && (
                              <div className="avatar more">+{cast.length - 4}</div>
                            )}
                          </>
                        ) : (
                          <span className="dd-show-empty">No cast yet</span>
                        )}
                      </div>
                      <div className="dd-show-next">
                        <div className="lbl">Next</div>
                        <div className="val">{nextLabel}</div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
            {canManage && (
              <Link href="/productions/new" className="dd-show dd-show-new">
                <Plus size={16} aria-hidden /> New production
              </Link>
            )}
          </div>
        </section>

        {/* Bento: mentions / announcements / pinned */}
        <section className="dd-bento">
          <BentoMentions items={serializedMentions} />

          <div className="dd-card">
            <div className="dd-card-head">
              <div className="dd-card-title">
                <div className="dd-card-ico">
                  <Bell size={15} aria-hidden />
                </div>
                <h3>Announcements</h3>
              </div>
              <Link href="/announcements" className="dd-link">
                All <ChevronRight size={12} aria-hidden />
              </Link>
            </div>
            <div className="dd-ann">
              {serializedAnnouncements.length === 0 ? (
                <div className="dd-ann-item" style={{ color: "var(--ink-3)" }}>
                  No announcements yet.
                </div>
              ) : (
                serializedAnnouncements.slice(0, 3).map((a) => {
                  const info = ackInfo[a.id];
                  return (
                    <article key={a.id} className="dd-ann-item">
                      <div className="dd-ann-top">
                        <span
                          className="dd-ann-scope"
                          data-s={a.scope}
                        >
                          {a.scope === "prod" ? (
                            <Hash size={10} aria-hidden />
                          ) : (
                            <Layers size={10} aria-hidden />
                          )}
                          {a.scopeLabel}
                        </span>
                        <span className="dd-ann-time mono">{a.relativeTime}</span>
                      </div>
                      <h4 className="dd-ann-title">{a.title}</h4>
                      {a.body && <p className="dd-ann-body">{a.body}</p>}
                      <div className="dd-ann-from">
                        <b>{a.authorName}</b>
                      </div>
                      {info && (
                        <AnnouncementAckButton
                          announcementId={a.id}
                          acked={info.mine}
                          count={info.acked}
                          total={info.total}
                        />
                      )}
                    </article>
                  );
                })
              )}
            </div>
          </div>

          <PinnedBento pins={pins} />
        </section>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          MOBILE DASHBOARD (phone widths only — hidden on desktop)
          ════════════════════════════════════════════════════════════════ */}
      <div className="dashboard-phone-only">
        <MobileDashboard
          greeting={greeting}
          greetingNote={greetingNote}
          firstName={firstName}
          role={roleLabel(user.role)}
          todayLabel={todayLabel}
          unreadMentionCount={unreadMentionCount}
          announcementCount={announcements.length}
          activeShows={activeShows}
          focal={focalProps}
          timeline={mdTimeline}
          moreThisWeek={mdMoreThisWeek}
          shows={mdShows}
          canManage={canManage}
          mentions={serializedMentions}
          announcements={mdAnnouncements}
          pins={mdPins}
        />
      </div>
    </div>
  );
}

// ─── Desktop bento "Pinned" card (server-rendered links) ───────────────
function pinHref(pin: PinRow): string {
  const base = `/productions/${pin.productionSlug}`;
  if (pin.itemType === "report") return `${base}/reports/${pin.itemId}`;
  if (pin.itemType === "document") return `${base}/documents/${pin.itemId}`;
  return `${base}/notes`;
}
function PinBentoIcon({ itemType, subtype }: { itemType: string; subtype: string }) {
  if (itemType === "report") return <FileText size={15} aria-hidden />;
  if (itemType === "note" && subtype === "todo")
    return <CheckSquare size={15} aria-hidden />;
  if (itemType === "note") return <Pencil size={15} aria-hidden />;
  return <File size={15} aria-hidden />;
}
function PinnedBento({ pins }: { pins: PinRow[] }) {
  return (
    <div className="dd-card">
      <div className="dd-card-head">
        <div className="dd-card-title">
          <div className="dd-card-ico">
            <Pin size={14} aria-hidden />
          </div>
          <h3>Pinned</h3>
        </div>
      </div>
      <div className="dd-pins">
        {pins.length === 0 ? (
          <div className="dd-pin-empty">Nothing pinned yet.</div>
        ) : (
          pins.slice(0, 5).map((pin) => (
            <Link
              key={pin.pinId}
              href={pinHref(pin)}
              className="dd-pin"
              data-kind={pin.itemType}
            >
              <div className="dd-pin-ico">
                <PinBentoIcon itemType={pin.itemType} subtype={pin.subtype} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div className="dd-pin-title">{pin.title}</div>
                <div className="dd-pin-meta">{pin.productionTitle}</div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
