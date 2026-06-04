"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Clipboard,
  FileText,
  File,
  Pencil,
  CheckSquare,
  Calendar,
  Plus,
  ChevronRight,
  Check,
  Hash,
  Layers,
  X,
} from "lucide-react";
import { confirmCall } from "@/features/calls/actions";
import { markMentionRead, dismissMention } from "@/features/mentions/actions";
import { AnnouncementAckButton } from "./announcement-ack-button";
import type { FocalCallProps } from "./focal-call";
import type { SerializedMention } from "./mentions-section";
import type { SerializedAnnouncement } from "./dashboard-announcements";

export type MdTimelineItem = {
  id: string;
  time: string;
  what: string;
  sub: string;
  state: "done" | "now" | "up";
};

export type MdShow = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  status: string;
  color: string;
  unread: number;
  progLabel: string;
  opens: string;
  pct: number;
  principals: { initials: string; color: string }[];
  extraPrincipals: number;
  next: string;
};

export type MdPin = {
  id: string;
  title: string;
  meta: string;
  href: string;
  kind: string;
};

export type MdAnnouncement = SerializedAnnouncement & {
  ack: { acked: number; total: number; mine: boolean } | null;
};

export type MobileDashboardProps = {
  greeting: string;
  greetingNote?: string;
  firstName: string;
  role: string;
  todayLabel: string;
  unreadMentionCount: number;
  announcementCount: number;
  activeShows: number;
  focal: FocalCallProps | null;
  timeline: MdTimelineItem[];
  moreThisWeek: string | null;
  shows: MdShow[];
  canManage: boolean;
  mentions: SerializedMention[];
  announcements: MdAnnouncement[];
  pins: MdPin[];
};

const MENTION_COLORS = [
  "var(--c-clay)",
  "var(--c-sage)",
  "var(--c-dusk)",
  "var(--c-amber)",
  "var(--c-plum)",
  "var(--c-sand)",
];
function colorForName(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return MENTION_COLORS[h % MENTION_COLORS.length];
}
function highlight(text: string) {
  return text.split(/(@\S+)/).map((part, i) =>
    part.startsWith("@") ? (
      <span key={i} className="md-tag">
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

function useMdCountdown(startIso: string | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!startIso) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [startIso]);
  if (!startIso) return null;
  const diff = new Date(startIso).getTime() - now;
  if (diff <= 0) return { h: 0, m: 0, s: 0 };
  return {
    h: Math.floor(diff / 3.6e6),
    m: Math.floor((diff % 3.6e6) / 6e4),
    s: Math.floor((diff % 6e4) / 1000),
  };
}

function PinIcon({ kind }: { kind: string }) {
  if (kind === "report") return <FileText size={15} aria-hidden />;
  if (kind === "todo") return <CheckSquare size={15} aria-hidden />;
  if (kind === "note") return <Pencil size={15} aria-hidden />;
  return <File size={15} aria-hidden />;
}

export function MobileDashboard(props: MobileDashboardProps) {
  const {
    greeting,
    greetingNote,
    firstName,
    role,
    todayLabel,
    unreadMentionCount,
    announcementCount,
    activeShows,
    focal,
    timeline,
    moreThisWeek,
    shows,
    canManage,
    mentions,
    announcements,
    pins,
  } = props;

  return (
    <div className="md-root">
      {/* Greeting */}
      <div className="md-greet">
        <div className="md-greet-eyebrow">Workspace · {role}</div>
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
          <div
            className="muted"
            style={{ fontSize: 13, marginTop: 2 }}
          >
            {greetingNote}
          </div>
        )}
        <div className="md-greet-date">{todayLabel}</div>
      </div>

      {/* Status chips */}
      <div className="md-chips">
        <div className="md-chip" data-tone="accent">
          <span className="md-chip-num">{unreadMentionCount}</span>
          <span className="md-chip-lbl">
            mention{unreadMentionCount !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="md-chip" data-tone="amber">
          <span className="md-chip-num">{announcementCount}</span>
          <span className="md-chip-lbl">
            announcement{announcementCount !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="md-chip">
          <span className="md-chip-num">{activeShows}</span>
          <span className="md-chip-lbl">shows</span>
        </div>
      </div>

      {focal && <MdFocal focal={focal} />}

      {/* Today timeline */}
      {timeline.length > 0 && (
        <>
          <div className="sec-h-row">
            <h3 className="sec-h">Today</h3>
          </div>
          <div style={{ padding: "0 14px" }}>
            <div className="mob-card" style={{ padding: "6px 0" }}>
              <div className="md-tl">
                {timeline.map((d) => (
                  <div key={d.id} className="md-tl-item" data-state={d.state}>
                    <span className="md-tl-time">{d.time}</span>
                    <span className="md-tl-node" />
                    <div className="md-tl-main">
                      <div className="md-tl-what">
                        {d.what}
                        {d.state === "now" && (
                          <span className="md-tl-now">NOW</span>
                        )}
                      </div>
                      {d.sub && <div className="md-tl-sub">{d.sub}</div>}
                    </div>
                  </div>
                ))}
              </div>
              {moreThisWeek && (
                <div className="md-tl-foot">
                  <Calendar size={13} aria-hidden />
                  <span>{moreThisWeek}</span>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Shows carousel */}
      {shows.length > 0 && (
        <>
          <div className="sec-h-row">
            <h3 className="sec-h">Your shows</h3>
            <Link className="sec-more" href="/productions">
              All
            </Link>
          </div>
          <div className="md-shows-scroll">
            <div className="md-shows-track">
              {shows.map((p) => (
                <Link
                  key={p.id}
                  href={`/productions/${p.slug}`}
                  className="md-show"
                  data-status={p.status}
                >
                  <div className="md-show-band" style={{ background: p.color }} />
                  <div className="md-show-in">
                    <div className="md-show-top">
                      <span className="md-show-status">
                        <span
                          className="md-prod-dot"
                          style={{ background: p.color }}
                        />
                        {p.status}
                      </span>
                      {p.unread > 0 && (
                        <span className="md-show-unread">{p.unread}</span>
                      )}
                    </div>
                    <h4 className="md-show-title">{p.title}</h4>
                    <div className="md-show-role">{p.subtitle}</div>
                    <div className="md-prog">
                      <div className="md-prog-top">
                        <span>{p.progLabel}</span>
                        <span>Opens {p.opens}</span>
                      </div>
                      <div className="md-prog-track">
                        <div
                          className="md-prog-fill"
                          style={{
                            width: `${p.pct}%`,
                            background:
                              p.status === "archived" ? "var(--ink-4)" : p.color,
                          }}
                        />
                      </div>
                    </div>
                    <div className="md-show-foot">
                      <div className="md-stack">
                        {p.principals.length > 0 ? (
                          <>
                            {p.principals.map((a, i) => (
                              <div
                                key={i}
                                className="md-av-sm"
                                style={{ background: a.color }}
                                aria-hidden
                              >
                                {a.initials}
                              </div>
                            ))}
                            {p.extraPrincipals > 0 && (
                              <div className="md-av-sm md-more">
                                +{p.extraPrincipals}
                              </div>
                            )}
                          </>
                        ) : (
                          <span style={{ fontSize: 11, color: "var(--ink-4)" }}>
                            No cast
                          </span>
                        )}
                      </div>
                      <span className="md-show-next">{p.next}</span>
                    </div>
                  </div>
                </Link>
              ))}
              {canManage && (
                <Link href="/productions/new" className="md-show-new">
                  <Plus size={18} aria-hidden />
                  <span>
                    New
                    <br />
                    production
                  </span>
                </Link>
              )}
            </div>
          </div>
        </>
      )}

      {/* Mentions */}
      {mentions.length > 0 && (
        <MdMentions items={mentions} unread={unreadMentionCount} />
      )}

      {/* Announcements */}
      {announcements.length > 0 && (
        <>
          <div className="sec-h-row">
            <h3 className="sec-h">Announcements</h3>
            <Link className="sec-more" href="/announcements">
              All
            </Link>
          </div>
          <div className="md-feed">
            {announcements.slice(0, 4).map((a) => (
              <div key={a.id} className="mob-card md-ann">
                <div className="md-ann-top">
                  <span
                    className="md-ann-scope"
                    data-s={a.isOrgWide ? "org" : "prod"}
                  >
                    {a.isOrgWide ? (
                      <Layers size={10} aria-hidden />
                    ) : (
                      <Hash size={10} aria-hidden />
                    )}
                    {a.isOrgWide ? "All productions" : a.productionTitle}
                  </span>
                  <span className="md-ann-time">{a.relativeTime}</span>
                </div>
                <h4 className="md-ann-title">{a.title}</h4>
                {a.body && <p className="md-ann-body">{a.body}</p>}
                <div className="md-ann-from">{a.authorName}</div>
                {a.ack && (
                  <AnnouncementAckButton
                    announcementId={a.id}
                    acked={a.ack.mine}
                    count={a.ack.acked}
                    total={a.ack.total}
                  />
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Pinned */}
      {pins.length > 0 && (
        <>
          <div className="sec-h-row">
            <h3 className="sec-h">Pinned</h3>
          </div>
          <div style={{ padding: "0 14px" }}>
            <div className="mob-card" style={{ padding: 6 }}>
              {pins.map((p, i) => (
                <Link
                  key={p.id}
                  href={p.href}
                  className="md-pin tap"
                  data-kind={p.kind}
                  style={{
                    borderTop: i === 0 ? "none" : "1px solid var(--border)",
                  }}
                >
                  <div className="md-pin-ico">
                    <PinIcon kind={p.kind} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                    <div className="md-pin-title">{p.title}</div>
                    <div className="md-pin-meta">{p.meta}</div>
                  </div>
                  <ChevronRight
                    size={15}
                    aria-hidden
                    style={{ color: "var(--ink-4)", flexShrink: 0 }}
                  />
                </Link>
              ))}
            </div>
          </div>
        </>
      )}

      <div style={{ height: 18 }} />
    </div>
  );
}

function MdFocal({ focal }: { focal: FocalCallProps }) {
  const cd = useMdCountdown(focal.startIso);
  const [pending, startTransition] = useTransition();
  const [mine, setMine] = useState(focal.myConfirmed);
  const [confirmedCount, setConfirmedCount] = useState(focal.confirmed);

  function toggleConfirm() {
    const next = !mine;
    setMine(next);
    setConfirmedCount((c) => Math.max(0, c + (next ? 1 : -1)));
    startTransition(async () => {
      await confirmCall(focal.callId);
    });
  }

  const pct = focal.called > 0 ? Math.round((confirmedCount / focal.called) * 100) : 0;
  const avatars = focal.confirmedAvatars.slice(0, 4);
  const extra = Math.max(0, confirmedCount - avatars.length);

  return (
    <div style={{ padding: "4px 14px 0" }}>
      <div className="md-focal">
        <div className="md-focal-top">
          <span className="md-live">
            <span className="md-live-dot" /> {focal.isLive ? "Live now" : "Next call"}
          </span>
          <span className="md-focal-prod">
            <span
              className="md-prod-dot"
              style={{ background: focal.productionColorVar }}
            />
            {focal.productionTitle}
          </span>
        </div>

        <div className="md-focal-when">{focal.whenLabel}</div>
        <h2 className="md-focal-title">{focal.title}</h2>
        {focal.where.length > 0 && (
          <div className="md-focal-where">
            <MapPin size={12} aria-hidden />
            {focal.where.map((w, i) => (
              <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
                {i > 0 && <span className="md-pip" />}
                <span>{w}</span>
              </span>
            ))}
          </div>
        )}

        <div className="md-focal-mid">
          <div className="md-count">
            <span className="md-count-lbl">
              {focal.isLive ? "In progress" : "Starts in"}
            </span>
            <span className="md-count-val">
              {focal.isLive || !cd ? (
                focal.isLive ? "now" : "—"
              ) : (
                <>
                  {cd.h}
                  <span className="u">h</span>
                  {String(cd.m).padStart(2, "0")}
                  <span className="u">m</span>
                  {String(cd.s).padStart(2, "0")}
                  <span className="u">s</span>
                </>
              )}
            </span>
          </div>
          <div className="md-called">
            <div className="md-stack">
              {avatars.map((a, i) => (
                <div
                  key={i}
                  className="md-av-sm"
                  style={{ background: a.color }}
                  aria-hidden
                >
                  {a.initials}
                </div>
              ))}
              {extra > 0 && <div className="md-av-sm md-more">+{extra}</div>}
            </div>
            <span className="md-called-txt">
              {confirmedCount > 0 ? (
                <>
                  <b>
                    {confirmedCount}/{focal.called}
                  </b>{" "}
                  confirmed
                </>
              ) : (
                "No RSVPs yet"
              )}
            </span>
          </div>
        </div>
        <div className="md-called-bar">
          <div className="md-called-fill" style={{ width: `${pct}%` }} />
        </div>

        <div className="md-focal-cta">
          {focal.isMember && (
            <button
              type="button"
              className={"mbtn " + (mine ? "" : "primary")}
              style={{ flex: 1 }}
              onClick={toggleConfirm}
              disabled={pending}
              data-confirmed={mine ? "1" : "0"}
            >
              <Check size={15} aria-hidden />
              <span>{mine ? "Confirmed" : "Confirm"}</span>
            </button>
          )}
          <Link
            className="mbtn"
            href={focal.callsHref}
            style={{ flex: focal.isMember ? "0 0 auto" : 1, paddingLeft: 14, paddingRight: 14 }}
          >
            <Clipboard size={15} aria-hidden />
            <span>Schedule</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

function MdMentions({
  items,
  unread,
}: {
  items: SerializedMention[];
  unread: number;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [faded, setFaded] = useState<Set<string>>(new Set());
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState(false);

  function tap(m: SerializedMention) {
    if (m.isUnread && !faded.has(m.id)) {
      setFaded((p) => new Set([...p, m.id]));
      startTransition(async () => {
        await markMentionRead(m.id);
      });
    }
    if (m.href) router.push(m.href);
  }

  function dismiss(e: React.MouseEvent, m: SerializedMention) {
    e.stopPropagation();
    setDismissed((p) => new Set([...p, m.id]));
    startTransition(async () => {
      await dismissMention(m.id);
    });
  }

  const visible = items.filter((m) => !dismissed.has(m.id));
  const shown = expanded ? visible : visible.slice(0, 5);

  return (
    <>
      <div className="sec-h-row">
        <h3 className="sec-h">
          Waiting on you
          {unread > 0 && <span className="md-count-pill">{unread}</span>}
        </h3>
      </div>
      <div className="md-feed">
        {shown.map((m) => {
          const isUnread = m.isUnread && !faded.has(m.id);
          return (
            <div
              key={m.id}
              role="button"
              tabIndex={0}
              className="mob-card tap md-ment"
              data-unread={isUnread ? "1" : "0"}
              onClick={() => tap(m)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") tap(m);
              }}
            >
              <div
                className="md-av"
                style={{ background: colorForName(m.fromName) }}
                aria-hidden
              >
                {m.fromInitials}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="md-ment-head">
                  <span className="md-ment-from">{m.fromName}</span>
                  <span className="md-ment-time">{m.relativeTime}</span>
                </div>
                {m.snippet && <p className="md-ment-snip">{highlight(m.snippet)}</p>}
                {(m.contextTitle || m.productionTitle) && (
                  <span className="md-ment-where">
                    {m.contextTitle ?? m.productionTitle}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={(e) => dismiss(e, m)}
                aria-label="Dismiss mention"
                style={{
                  alignSelf: "flex-start",
                  background: "none",
                  border: "none",
                  padding: 4,
                  cursor: "pointer",
                  color: "var(--ink-4)",
                }}
              >
                <X size={15} aria-hidden />
              </button>
            </div>
          );
        })}
        {visible.length > 5 && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="md-link"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "6px 0",
              textAlign: "left",
            }}
          >
            {expanded ? "Show less" : `View all ${visible.length}`}
          </button>
        )}
      </div>
    </>
  );
}
