"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";

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

  const unreadCount = items.filter((m) => m.isUnread).length;
  const filtered = tab === "unread" ? items.filter((m) => m.isUnread) : items;

  return (
    <section className="home-section">
      <header className="home-section-head">
        <div>
          <div className="h-eyebrow">@Mentions</div>
          <h2 className="h-section">Things waiting on you</h2>
        </div>
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
      </header>

      <div className="mentions-list">
        {filtered.length === 0 ? (
          <div className="mention-empty">
            <Check size={20} aria-hidden />
            <div>You&apos;re all caught up — no unread mentions.</div>
          </div>
        ) : (
          filtered.map((m) => (
            <article
              key={m.id}
              className="mention"
              data-unread={m.isUnread ? "1" : "0"}
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
                {m.href ? (
                  <Link
                    href={m.href}
                    className="btn ghost"
                    style={{ height: 26, padding: "0 8px", fontSize: 11.5 }}
                  >
                    Open
                  </Link>
                ) : (
                  <span />
                )}
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
