"use client";

import { useState, useTransition, useRef, useEffect, useCallback } from "react";
import { Send } from "lucide-react";
import {
  postComment,
  fetchDocumentComments,
} from "@/features/documents/actions";
import { MentionTextarea } from "@/components/ui/mention-textarea";
import { MentionBody } from "@/components/ui/mention-body";
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
  const endRef = useRef<HTMLDivElement>(null);

  const reload = useCallback(async () => {
    const result = await fetchDocumentComments(documentId);
    if (!Array.isArray(result)) {
      setLoading(false);
      return;
    }
    setComments(result);
    setLoading(false);
  }, [documentId]);

  useEffect(() => {
    // Intentional: load comments on mount / when the document changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    reload();
  }, [reload]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

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
        await reload();
      }
    });
  }

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
          <div
            style={{
              color: "var(--ink-4)",
              fontSize: 13,
              textAlign: "center",
              marginTop: 20,
            }}
          >
            Loading…
          </div>
        ) : comments.length === 0 ? (
          <div
            style={{
              color: "var(--ink-4)",
              fontSize: 13,
              textAlign: "center",
              marginTop: 20,
            }}
          >
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
              <div
                style={{ fontSize: 13, lineHeight: 1.5, color: "var(--ink-2)" }}
              >
                <MentionBody body={c.body} />
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
        }}
      >
        {error && (
          <p style={{ fontSize: 12, color: "var(--c-clay)", marginBottom: 6 }}>
            {error}
          </p>
        )}
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          <MentionTextarea
            value={body}
            onChange={setBody}
            onSubmit={submitComment}
            members={members}
            placeholder="Add a comment… use @ to mention someone"
            rows={2}
            disabled={isPending}
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
