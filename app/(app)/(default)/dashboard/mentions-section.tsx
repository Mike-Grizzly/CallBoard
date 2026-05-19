"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Circle } from "lucide-react";
import {
  markMentionRead,
  markMentionUnread,
  markAllMentionsRead,
} from "@/features/mentions/actions";

export type SerializedMention = {
  id: string;
  contextType: string;
  contextId: string;
  contextTitle: string | null;
  snippet: string | null;
  isUnread: boolean;
  fromName: string;
  fromInitials: string;
  fromColor: string;
  productionTitle: string | null;
  productionSlug: string | null;
  relativeTime: string;
  href: string;
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

function highlightMention(text: string) {
  return text.split(/(@\S+)/).map((part, i) =>
    part.startsWith("@") ? (
      <span key={i} className="mention-tag">{part}</span>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

export function MentionsSection({ items }: { items: SerializedMention[] }) {
  const [tab, setTab] = useState<"unread" | "all">("unread");
  // fadedIds: marked read optimistically (loses highlight, stays visible until nav)
  const [fadedIds, setFadedIds] = useState<Set<string>>(new Set());
  // unfadedIds: marked unread optimistically (restores highlight)
  const [unfadedIds, setUnfadedIds] = useState<Set<string>>(new Set());
  const [, startTransition] = useTransition();
  const router = useRouter();

  function effectiveUnread(m: SerializedMention): boolean {
    return (m.isUnread || unfadedIds.has(m.id)) && !fadedIds.has(m.id);
  }

  const unreadCount = items.filter(effectiveUnread).length;

  const filtered =
    tab === "unread"
      ? items.filter((m) => m.isUnread || unfadedIds.has(m.id)) // keep faded visible until nav
      : items;

  function handleCardClick(m: SerializedMention) {
    if (effectiveUnread(m)) {
      setFadedIds((prev) => new Set([...prev, m.id]));
      setUnfadedIds((prev) => { const s = new Set(prev); s.delete(m.id); return s; });
      startTransition(async () => { await markMentionRead(m.id); });
    }
    if (m.href) router.push(m.href);
  }

  function handleMarkUnread(e: React.MouseEvent, m: SerializedMention) {
    e.stopPropagation();
    setUnfadedIds((prev) => new Set([...prev, m.id]));
    setFadedIds((prev) => { const s = new Set(prev); s.delete(m.id); return s; });
    startTransition(async () => { await markMentionUnread(m.id); });
  }

  function handleMarkAllRead() {
    const toFade = new Set(items.filter(effectiveUnread).map((m) => m.id));
    setFadedIds((prev) => new Set([...prev, ...toFade]));
    startTransition(async () => { await markAllMentionsRead(); });
  }

  return (
    <section className="home-section">
      <header className="home-section-head">
        <div>
          <div className="h-eyebrow">@Mentions</div>
          <h2 className="h-section">Things waiting on you</h2>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {unreadCount > 0 && (
            <button
              type="button"
              className="btn ghost"
              onClick={handleMarkAllRead}
              style={{ fontSize: 12, height: 28, padding: "0 10px" }}
            >
              Mark all read
            </button>
          )}
          <div className="seg">
            <button
              data-on={String(tab === "unread")}
              onClick={() => setTab("unread")}
            >
              Unread
              {unreadCount > 0 && (
                <span className="seg-count">{unreadCount}</span>
              )}
            </button>
            <button
              data-on={String(tab === "all")}
              onClick={() => setTab("all")}
            >
              All
            </button>
          </div>
        </div>
      </header>

      <div className="mentions-list">
        {filtered.length === 0 ? (
          <div className="mention-empty">
            <Check size={20} aria-hidden />
            <div>You&apos;re all caught up — no unread mentions.</div>
          </div>
        ) : (
          filtered.map((m) => {
            const isUnread = effectiveUnread(m);
            return (
              <div
                key={m.id}
                role="button"
                tabIndex={0}
                onClick={() => handleCardClick(m)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") handleCardClick(m);
                }}
                className="mention"
                data-unread={isUnread ? "1" : "0"}
                style={{ cursor: m.href ? "pointer" : "default" }}
              >
                <div
                  className="avatar mention-avatar"
                  style={{ background: colorForName(m.fromName) }}
                  aria-hidden
                >
                  {m.fromInitials}
                </div>
                <div className="mention-body">
                  <div className="mention-head">
                    <span className="mention-from">{m.fromName}</span>
                    {m.contextTitle && (
                      <span className="muted"> in {m.contextTitle}</span>
                    )}
                  </div>
                  {m.snippet && (
                    <p className="mention-snippet">
                      {highlightMention(m.snippet)}
                    </p>
                  )}
                  <div className="mention-foot">
                    {m.productionTitle && (
                      <span className="mention-chip">
                        <span
                          className="rn-pip"
                          style={{ background: "var(--ink-3)" }}
                        />
                        {m.productionTitle}
                      </span>
                    )}
                    <span className="mention-chip">{m.contextType}</span>
                  </div>
                </div>
                <div className="mention-side">
                  <span className="muted mono" style={{ fontSize: 11 }}>
                    {m.relativeTime}
                  </span>
                  {!isUnread && (
                    <button
                      type="button"
                      onClick={(e) => handleMarkUnread(e, m)}
                      title="Mark as unread"
                      className="mention-unread-btn"
                    >
                      <Circle size={11} />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
