"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Circle, CheckCircle2, PenLine, Pin } from "lucide-react";
import type { NoteTagRow } from "@/features/notes/queries";

export interface FeedNote {
  id: string;
  productionId: string;
  productionTitle: string;
  productionSlug: string;
  productionColorVar: string;
  title: string;
  content: string;
  isTodo: boolean;
  isCompleted: boolean;
  isPinned: boolean;
  tagId: string | null;
  dueDate: string | null;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

type Filter = "all" | "todo" | "notes" | "pinned";

const FILTER_LABELS: Record<Filter, string> = {
  all: "All",
  todo: "To-do",
  notes: "Notes",
  pinned: "Pinned",
};

const FILTERS: Filter[] = ["all", "todo", "notes", "pinned"];

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function relativeTime(iso: string): string {
  const t = new Date(iso).getTime();
  const diff = Date.now() - t;
  const mins = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (mins < 2) return "just now";
  if (mins < 60) return `${mins}m`;
  if (hours < 24) return `${hours}h`;
  if (days === 1) return "yest.";
  if (days < 7) return `${days}d`;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function dueLabel(dueDateStr: string): string {
  const due = new Date(`${dueDateStr}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round(
    (due.getTime() - today.getTime()) / 86_400_000,
  );
  if (diff === 0) return "today";
  if (diff === 1) return "tomorrow";
  if (diff === -1) return "yesterday";
  if (diff > 0 && diff < 7) return due.toLocaleDateString("en-US", { weekday: "short" });
  return due.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Workspace notes feed. Client component for filter state. Cards
 * match the mobile demo: small icon + colored production label,
 * title (strikethrough when complete), excerpt, footer with tag pill,
 * due date, and relative timestamp. Each card deep-links to the
 * note's production-scoped editor (`?id=` opens it directly).
 */
export function NotesFeed({
  notes,
  tags,
}: {
  notes: FeedNote[];
  tags: NoteTagRow[];
}) {
  const [filter, setFilter] = useState<Filter>("all");

  const tagById = useMemo(() => {
    const map = new Map<string, NoteTagRow>();
    for (const t of tags) map.set(t.id, t);
    return map;
  }, [tags]);

  const visible = useMemo(() => {
    if (filter === "all") return notes;
    if (filter === "todo") return notes.filter((n) => n.isTodo);
    if (filter === "notes") return notes.filter((n) => !n.isTodo);
    return notes.filter((n) => n.isPinned);
  }, [filter, notes]);

  return (
    <div className="page-narrow nf-page anim-in">
      <div className="row-between" style={{ marginBottom: 12 }}>
        <div>
          <h2 className="h-section">My notes</h2>
          <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>
            Across every show you&apos;re on · newest first
          </div>
        </div>
      </div>

      <div className="nf-filters">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className="nf-filter"
            data-active={filter === f ? "1" : "0"}
          >
            {FILTER_LABELS[f]}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="nf-empty">
          <PenLine size={28} aria-hidden />
          <div className="nf-empty-h">
            {notes.length === 0
              ? "You haven't taken any notes yet."
              : "No notes match this filter."}
          </div>
          {notes.length === 0 && (
            <div className="nf-empty-sub">
              Open a production and use the Notes tab to jot something down.
            </div>
          )}
        </div>
      ) : (
        <div className="nf-list">
          {visible.map((note) => {
            const tag = note.tagId ? tagById.get(note.tagId) : null;
            const body = stripHtml(note.content);
            const done = note.isTodo && note.isCompleted;
            const href = `/productions/${note.productionSlug}/notes?id=${note.id}`;
            return (
              <Link key={note.id} href={href} className="nf-card" data-done={done ? "1" : "0"}>
                <span
                  className="nf-rail"
                  style={{ background: note.productionColorVar }}
                  aria-hidden
                />
                <div className="nf-icon">
                  {note.isTodo ? (
                    done ? (
                      <CheckCircle2 size={18} />
                    ) : (
                      <Circle size={18} />
                    )
                  ) : (
                    <PenLine size={14} />
                  )}
                </div>
                <div className="nf-body">
                  <div className="nf-head">
                    <span className="nf-prod">
                      <span
                        className="nf-prod-dot"
                        style={{ background: note.productionColorVar }}
                        aria-hidden
                      />
                      {note.productionTitle}
                    </span>
                    {note.isPinned ? (
                      <Pin size={11} className="nf-pin" aria-label="Pinned" />
                    ) : null}
                    <span className="nf-time">{relativeTime(note.createdAt)}</span>
                  </div>
                  <div className="nf-title">{note.title || "Untitled note"}</div>
                  {body ? <div className="nf-excerpt">{body}</div> : null}
                  {(tag || note.dueDate) && (
                    <div className="nf-meta">
                      {tag ? (
                        <span
                          className="nf-tag"
                          style={{
                            background: `color-mix(in oklch, ${tag.color} 18%, transparent)`,
                            color: `color-mix(in oklch, ${tag.color} 55%, var(--ink))`,
                          }}
                        >
                          {tag.name}
                        </span>
                      ) : null}
                      {note.dueDate ? (
                        <span className="nf-due">due {dueLabel(note.dueDate)}</span>
                      ) : null}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
