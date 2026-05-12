"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Trash2, Send } from "lucide-react";
import {
  getBeatComments,
  createBeatComment,
  deleteBeatComment,
} from "@/features/blocking/actions";
import type { BeatCommentWithAuthor } from "@/features/blocking/actions";
import type { ProductionMember } from "@/features/members/queries";

type Props = {
  beatId: string | null;
  currentUserId: string;
  productionMembers: ProductionMember[];
  canModerate: boolean;
};

// ─── @mention helpers ────────────────────────────────────────────────

function getMentionTrigger(text: string, cursorPos: number): string | null {
  const before = text.slice(0, cursorPos);
  const match = before.match(/@([\w]*)$/);
  return match ? match[1] : null;
}

function memberDisplayName(m: ProductionMember): string {
  return m.firstName || m.lastName
    ? `${m.firstName ?? ""} ${m.lastName ?? ""}`.trim()
    : m.email;
}

// Parse body text and highlight @mentions in rendered comments
function renderBody(body: string, members: ProductionMember[]) {
  const nameMap = new Map(members.map((m) => [memberDisplayName(m), m.userId]));
  const parts = body.split(/(@\S+)/g);
  return parts.map((part, i) => {
    if (part.startsWith("@")) {
      const name = part.slice(1);
      if (nameMap.has(name)) {
        return (
          <span
            key={i}
            style={{
              background: "var(--accent-soft)",
              color: "var(--accent-ink)",
              borderRadius: 3,
              padding: "0 3px",
              fontWeight: 500,
            }}
          >
            {part}
          </span>
        );
      }
    }
    return <span key={i}>{part}</span>;
  });
}

function formatTime(date: Date | string) {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  return d.toLocaleDateString();
}

// ─── Main Component ──────────────────────────────────────────────────

export function BeatCommentSection({
  beatId,
  currentUserId,
  productionMembers,
  canModerate,
}: Props) {
  const [comments, setComments] = useState<BeatCommentWithAuthor[]>([]);
  const [loading, setLoading] = useState(false);
  const [body, setBody] = useState("");
  const [mentionedIds, setMentionedIds] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // @mention picker state
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionIndex, setMentionIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const listEndRef = useRef<HTMLDivElement>(null);

  // Load comments when beat changes
  useEffect(() => {
    if (!beatId) {
      setComments([]);
      return;
    }
    setLoading(true);
    getBeatComments(beatId)
      .then(setComments)
      .finally(() => setLoading(false));
  }, [beatId]);

  // Scroll to bottom when new comments arrive
  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments.length]);

  const filteredMembers =
    mentionQuery !== null
      ? productionMembers.filter((m) =>
          memberDisplayName(m)
            .toLowerCase()
            .startsWith(mentionQuery.toLowerCase()),
        )
      : [];

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const val = e.target.value;
      setBody(val);
      const cursor = e.target.selectionStart ?? val.length;
      const trigger = getMentionTrigger(val, cursor);
      setMentionQuery(trigger);
      setMentionIndex(0);
    },
    [],
  );

  function insertMention(member: ProductionMember) {
    if (!textareaRef.current) return;
    const cursor = textareaRef.current.selectionStart ?? body.length;
    const before = body.slice(0, cursor);
    const after = body.slice(cursor);
    // Replace the @query with @FullName
    const replaced = before.replace(/@[\w]*$/, `@${memberDisplayName(member)} `);
    setBody(replaced + after);
    setMentionedIds((prev) => new Set([...prev, member.userId]));
    setMentionQuery(null);
    // Restore focus
    setTimeout(() => {
      if (!textareaRef.current) return;
      const pos = replaced.length;
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(pos, pos);
    }, 0);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (mentionQuery !== null && filteredMembers.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setMentionIndex((i) => Math.min(i + 1, filteredMembers.length - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setMentionIndex((i) => Math.max(i - 1, 0));
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        insertMention(filteredMembers[mentionIndex]);
        return;
      }
      if (e.key === "Escape") {
        setMentionQuery(null);
        return;
      }
    }

    // Submit on Ctrl/Cmd+Enter when no picker open
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  }

  async function handleSubmit() {
    if (!beatId || !body.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    const result = await createBeatComment({
      beatId,
      body: body.trim(),
      mentionedUserIds: [...mentionedIds],
    });
    if (result.error) {
      setError(result.error);
    } else {
      setBody("");
      setMentionedIds(new Set());
      // Optimistically reload
      const fresh = await getBeatComments(beatId);
      setComments(fresh);
    }
    setSubmitting(false);
  }

  async function handleDelete(commentId: string) {
    const result = await deleteBeatComment(commentId);
    if (!result.error && beatId) {
      const fresh = await getBeatComments(beatId);
      setComments(fresh);
    }
  }

  if (!beatId) {
    return (
      <div
        className="flex flex-1 items-center justify-center muted"
        style={{ fontSize: 12, padding: "16px 12px", textAlign: "center" }}
      >
        Select a beat to view comments
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Comment list */}
      <div className="scroll flex-1 overflow-y-auto p-2" style={{ minHeight: 0 }}>
        {loading ? (
          <div className="muted" style={{ fontSize: 12, padding: "8px 4px" }}>
            Loading…
          </div>
        ) : comments.length === 0 ? (
          <div className="muted" style={{ fontSize: 12, padding: "8px 4px" }}>
            No comments yet.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {comments.map((c) => {
              const authorName =
                c.authorFirstName || c.authorLastName
                  ? `${c.authorFirstName ?? ""} ${c.authorLastName ?? ""}`.trim()
                  : c.authorEmail;
              const isOwn = c.createdBy === currentUserId;
              const canDelete = isOwn || canModerate;
              return (
                <div
                  key={c.id}
                  className="group"
                  style={{
                    padding: "8px 10px",
                    borderRadius: 6,
                    background: "var(--bg-elev)",
                    border: "1px solid var(--border)",
                    boxShadow: "var(--shadow-1)",
                  }}
                >
                  <div className="row-between" style={{ marginBottom: 4 }}>
                    <span
                      style={{
                        fontSize: 11.5,
                        fontWeight: 600,
                        color: "var(--ink)",
                      }}
                    >
                      {authorName}
                    </span>
                    <div className="row" style={{ gap: 4 }}>
                      <span className="muted" style={{ fontSize: 10.5 }}>
                        {formatTime(c.createdAt)}
                      </span>
                      {canDelete && (
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="hidden group-hover:block rounded p-0.5 hover:bg-[color:var(--bg-muted)]"
                          title="Delete comment"
                        >
                          <Trash2
                            className="h-3 w-3"
                            style={{ color: "var(--accent)" }}
                          />
                        </button>
                      )}
                    </div>
                  </div>
                  <div style={{ fontSize: 12.5, color: "var(--ink-2)", lineHeight: 1.45 }}>
                    {renderBody(c.body, productionMembers)}
                  </div>
                </div>
              );
            })}
            <div ref={listEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div
        style={{
          borderTop: "1px solid var(--border)",
          padding: "8px 8px 10px",
          position: "relative",
          flexShrink: 0,
        }}
      >
        {/* @mention picker */}
        {mentionQuery !== null && filteredMembers.length > 0 && (
          <div
            style={{
              position: "absolute",
              bottom: "100%",
              left: 8,
              right: 8,
              background: "var(--bg-elev)",
              border: "1px solid var(--border-strong)",
              borderRadius: 6,
              boxShadow: "var(--shadow-2)",
              zIndex: 50,
              overflow: "hidden",
            }}
          >
            {filteredMembers.slice(0, 6).map((m, i) => {
              const name = memberDisplayName(m);
              return (
                <button
                  key={m.userId}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    insertMention(m);
                  }}
                  className="w-full text-left"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "6px 10px",
                    fontSize: 12.5,
                    background: i === mentionIndex ? "var(--bg-muted)" : "transparent",
                    color: "var(--ink)",
                    cursor: "pointer",
                  }}
                >
                  <span style={{ fontWeight: 500 }}>{name}</span>
                  {m.characterName && (
                    <span className="muted" style={{ fontSize: 11 }}>
                      · {m.characterName}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        <textarea
          ref={textareaRef}
          value={body}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Add a comment… type @ to mention"
          className="field scroll"
          style={{
            minHeight: 60,
            maxHeight: 120,
            fontSize: 12.5,
            resize: "none",
            width: "100%",
          }}
          disabled={submitting}
        />
        {error && (
          <div style={{ fontSize: 11.5, color: "var(--accent)", marginTop: 4 }}>
            {error}
          </div>
        )}
        <div className="row-between" style={{ marginTop: 6 }}>
          <span className="muted" style={{ fontSize: 10.5 }}>
            ⌘↵ to send · @ to mention
          </span>
          <button
            onClick={handleSubmit}
            disabled={!body.trim() || submitting}
            className="btn primary"
            style={{ height: 26, padding: "0 10px", fontSize: 12 }}
          >
            <Send className="h-3 w-3" />
            <span>Send</span>
          </button>
        </div>
      </div>
    </div>
  );
}
