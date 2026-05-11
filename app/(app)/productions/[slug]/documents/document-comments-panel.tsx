"use client";

import {
  useState,
  useTransition,
  useRef,
  useEffect,
  useCallback,
} from "react";
import { Send } from "lucide-react";
import {
  postComment,
  fetchDocumentComments,
} from "@/features/documents/actions";
import type { DocumentCommentRow } from "@/features/documents/queries";
import type { ProductionMember } from "@/features/members/queries";

function formatTime(date: Date): string {
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function authorName(
  firstName: string | null,
  lastName: string | null,
  email: string,
): string {
  return `${firstName ?? ""} ${lastName ?? ""}`.trim() || email;
}

function renderBody(body: string): React.ReactNode[] {
  const parts = body.split(/(@\{[^}]+\})/g);
  return parts.map((part, i) => {
    const m = part.match(/^@\{([^}]+)\}$/);
    if (m) {
      return (
        <span
          key={i}
          style={{
            background: "color-mix(in oklch, var(--accent) 15%, transparent)",
            color: "var(--accent)",
            borderRadius: 3,
            padding: "0 3px",
            fontWeight: 500,
          }}
        >
          @{m[1]}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

interface Props {
  documentId: string;
  members: ProductionMember[];
}

export function DocumentCommentsPanel({ documentId, members }: Props) {
  const [comments, setComments] = useState<DocumentCommentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [mention, setMention] = useState<{
    query: string;
    start: number;
  } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const reload = useCallback(async () => {
    const rows = await fetchDocumentComments(documentId);
    setComments(rows);
    setLoading(false);
  }, [documentId]);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  function handleBodyChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value;
    setBody(val);

    // Detect @mention trigger
    const cursor = e.target.selectionStart ?? val.length;
    const before = val.slice(0, cursor);
    const match = before.match(/@(\w*)$/);
    if (match) {
      setMention({ query: match[1].toLowerCase(), start: cursor - match[0].length });
    } else {
      setMention(null);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Escape") {
      setMention(null);
    } else if (e.key === "Enter" && !e.shiftKey && !mention) {
      e.preventDefault();
      submitComment();
    }
  }

  function insertMention(member: ProductionMember) {
    if (!mention) return;
    const full = `${member.firstName ?? ""} ${member.lastName ?? ""}`.trim() || member.email;
    const token = `@{${full}} `;
    const before = body.slice(0, mention.start);
    const after = body.slice(textareaRef.current?.selectionStart ?? body.length);
    const newBody = before + token + after;
    setBody(newBody);
    setMention(null);
    setTimeout(() => {
      if (textareaRef.current) {
        const pos = before.length + token.length;
        textareaRef.current.selectionStart = pos;
        textareaRef.current.selectionEnd = pos;
        textareaRef.current.focus();
      }
    }, 0);
  }

  function submitComment() {
    const trimmed = body.trim();
    if (!trimmed || isPending) return;
    setError(null);
    const formData = new FormData();
    formData.set("document_id", documentId);
    formData.set("body", trimmed);
    startTransition(async () => {
      const result = await postComment(formData);
      if (result.error) {
        setError(result.error);
      } else {
        setBody("");
        setMention(null);
        await reload();
      }
    });
  }

  const filteredMembers = mention
    ? members.filter((m) => {
        const full = `${m.firstName ?? ""} ${m.lastName ?? ""}`.trim() || m.email;
        return full.toLowerCase().includes(mention.query);
      })
    : [];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid var(--border)",
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: ".06em",
          textTransform: "uppercase",
          color: "var(--ink-4)",
          flexShrink: 0,
        }}
      >
        Comments
      </div>

      {/* Comments list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px" }}>
        {loading ? (
          <div style={{ color: "var(--ink-4)", fontSize: 13, textAlign: "center", marginTop: 20 }}>
            Loading…
          </div>
        ) : comments.length === 0 ? (
          <div style={{ color: "var(--ink-4)", fontSize: 13, textAlign: "center", marginTop: 20 }}>
            No comments yet. Be the first to comment.
          </div>
        ) : (
          comments.map((c) => (
            <div
              key={c.id}
              style={{
                marginBottom: 16,
                paddingBottom: 16,
                borderBottom: "1px solid var(--border)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 4,
                }}
              >
                <span style={{ fontSize: 12.5, fontWeight: 500 }}>
                  {authorName(c.authorFirstName, c.authorLastName, c.authorEmail)}
                </span>
                <span style={{ fontSize: 11, color: "var(--ink-4)" }}>
                  {formatTime(c.createdAt)}
                </span>
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.5, color: "var(--ink-2)" }}>
                {renderBody(c.body)}
              </div>
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>

      {/* Input area */}
      <div
        style={{
          flexShrink: 0,
          borderTop: "1px solid var(--border)",
          padding: "10px 12px",
          position: "relative",
        }}
      >
        {/* @mention dropdown */}
        {mention && filteredMembers.length > 0 && (
          <div
            style={{
              position: "absolute",
              bottom: "calc(100% + 4px)",
              left: 12,
              right: 12,
              background: "var(--bg-elev)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-s)",
              boxShadow: "var(--shadow-1)",
              zIndex: 10,
              maxHeight: 180,
              overflowY: "auto",
            }}
          >
            {filteredMembers.map((m) => {
              const full =
                `${m.firstName ?? ""} ${m.lastName ?? ""}`.trim() || m.email;
              return (
                <button
                  key={m.id}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    insertMention(m);
                  }}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    padding: "8px 12px",
                    fontSize: 13,
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    color: "var(--ink)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      "var(--bg-muted)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      "transparent";
                  }}
                >
                  {full}
                  {m.role && (
                    <span style={{ color: "var(--ink-4)", fontSize: 11, marginLeft: 6 }}>
                      {m.role}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {error && (
          <p style={{ fontSize: 12, color: "var(--c-clay)", marginBottom: 6 }}>
            {error}
          </p>
        )}

        <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          <textarea
            ref={textareaRef}
            value={body}
            onChange={handleBodyChange}
            onKeyDown={handleKeyDown}
            placeholder="Add a comment… use @ to mention someone"
            rows={2}
            style={{
              flex: 1,
              resize: "none",
              fontSize: 13,
              padding: "8px 10px",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-s)",
              background: "var(--bg-sunken)",
              color: "var(--ink)",
              outline: "none",
              lineHeight: 1.5,
            }}
          />
          <button
            className="btn primary btn-icon"
            onClick={submitComment}
            disabled={isPending || !body.trim()}
            title="Post comment"
            style={{ height: 36, width: 36, flexShrink: 0 }}
          >
            <Send size={14} />
          </button>
        </div>
        <div style={{ fontSize: 11, color: "var(--ink-4)", marginTop: 4 }}>
          Enter to send · Shift+Enter for new line · @ to mention
        </div>
      </div>
    </div>
  );
}
