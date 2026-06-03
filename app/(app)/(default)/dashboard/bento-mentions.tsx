"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Hash, ChevronRight, X } from "lucide-react";
import { markMentionRead, dismissMention } from "@/features/mentions/actions";
import type { SerializedMention } from "./mentions-section";

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
      <span key={i} className="dd-tag">
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

/**
 * Desktop bento "Waiting on you" card. Clicking a mention marks it read
 * (optimistic) and navigates to the source, mirroring MentionsSection.
 */
export function BentoMentions({ items }: { items: SerializedMention[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [faded, setFaded] = useState<Set<string>>(new Set());
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState(false);

  const visible = items.filter((m) => !dismissed.has(m.id));
  const unread = visible.filter((m) => m.isUnread && !faded.has(m.id)).length;
  const shown = expanded ? visible : visible.slice(0, 4);

  function click(m: SerializedMention) {
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

  return (
    <div className="dd-card">
      <div className="dd-card-head">
        <div className="dd-card-title">
          <div className="dd-card-ico">
            <Hash size={15} aria-hidden />
          </div>
          <h3>Waiting on you</h3>
          {unread > 0 && <span className="dd-pillcount">{unread}</span>}
        </div>
      </div>
      <div className="dd-ment">
        {visible.length === 0 ? (
          <div className="dd-ment-empty">
            You&apos;re all caught up — no mentions waiting.
          </div>
        ) : (
          shown.map((m) => {
            const isUnread = m.isUnread && !faded.has(m.id);
            return (
              <div
                key={m.id}
                role="button"
                tabIndex={0}
                className="dd-ment-item"
                data-unread={isUnread ? "1" : "0"}
                onClick={() => click(m)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") click(m);
                }}
                style={{ cursor: m.href ? "pointer" : "default" }}
              >
                <div
                  className="avatar dd-ment-av"
                  style={{ background: colorForName(m.fromName) }}
                  aria-hidden
                >
                  {m.fromInitials}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div className="dd-ment-head">
                    <span className="dd-ment-from">{m.fromName}</span>
                    <span className="dd-ment-time mono">{m.relativeTime}</span>
                  </div>
                  {m.snippet && (
                    <p className="dd-ment-snip">{highlight(m.snippet)}</p>
                  )}
                  {(m.productionTitle || m.contextTitle) && (
                    <span className="dd-ment-where">
                      {m.contextTitle ?? m.productionTitle}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  className="dd-ment-dismiss"
                  onClick={(e) => dismiss(e, m)}
                  title="Dismiss"
                  aria-label="Dismiss mention"
                  style={{
                    alignSelf: "center",
                    display: "flex",
                    alignItems: "center",
                    background: "none",
                    border: "none",
                    padding: 4,
                    cursor: "pointer",
                    color: "var(--ink-4)",
                  }}
                >
                  <X size={14} aria-hidden />
                </button>
                <ChevronRight
                  size={14}
                  aria-hidden
                  style={{ color: "var(--ink-4)", alignSelf: "center" }}
                />
              </div>
            );
          })
        )}
        {visible.length > 4 && (
          <button
            type="button"
            className="dd-link"
            onClick={() => setExpanded((v) => !v)}
            style={{
              alignSelf: "flex-start",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px 0",
            }}
          >
            {expanded ? "Show less" : `View all ${visible.length}`}
          </button>
        )}
      </div>
    </div>
  );
}
