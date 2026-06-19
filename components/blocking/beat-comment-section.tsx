"use client";

import { useState, useEffect, useRef } from "react";
import { Trash2, Send } from "lucide-react";
import {
  getBeatComments,
  createBeatComment,
  deleteBeatComment,
} from "@/features/blocking/actions";
import type { BeatCommentWithAuthor } from "@/features/blocking/actions";
import { memberFullName } from "@/components/ui/mention-textarea";
import { MentionInput } from "@/components/ui/mention-input";
import { MentionBody } from "@/components/ui/mention-body";
import type { MentionMember } from "@/components/ui/mention-textarea";
import type { ProductionMember } from "@/features/members/queries";

type Props = {
  beatId: string | null;
  currentUserId: string;
  productionMembers: ProductionMember[];
  canModerate: boolean;
};

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

function toMentionMember(m: ProductionMember): MentionMember {
  return {
    id: m.userId,
    firstName: m.firstName,
    lastName: m.lastName,
    email: m.email,
    role: m.role,
  };
}

// Extract mentioned user IDs from @{Full Name} tokens using member list
function extractMentionedIds(body: string, members: ProductionMember[]): string[] {
  const tokens = body.match(/@\{([^}]+)\}/g) ?? [];
  return tokens.flatMap((token) => {
    const name = token.slice(2, -1);
    const match = members.find((m) => memberFullName(toMentionMember(m)) === name);
    return match ? [match.userId] : [];
  });
}

export function BeatCommentSection({
  beatId,
  currentUserId,
  productionMembers,
  canModerate,
}: Props) {
  const [comments, setComments] = useState<BeatCommentWithAuthor[]>([]);
  const [loading, setLoading] = useState(false);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listEndRef = useRef<HTMLDivElement>(null);

  const mentionMembers = productionMembers.map(toMentionMember);

  useEffect(() => {
    if (!beatId) {
      // Intentional: clear the list when no beat is selected, then load the
      // selected beat's comments below.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setComments([]);
      return;
    }
    setLoading(true);
    getBeatComments(beatId)
      .then(setComments)
      .finally(() => setLoading(false));
  }, [beatId]);

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments.length]);

  async function handleSubmit() {
    if (!beatId || !body.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    const result = await createBeatComment({
      beatId,
      body: body.trim(),
      mentionedUserIds: extractMentionedIds(body, productionMembers),
    });
    if (result.error) {
      setError(result.error);
    } else {
      setBody("");
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
          <div className="muted" style={{ fontSize: 12, padding: "8px 4px" }}>Loading…</div>
        ) : comments.length === 0 ? (
          <div className="muted" style={{ fontSize: 12, padding: "8px 4px" }}>No comments yet.</div>
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
                    <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--ink)" }}>
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
                          <Trash2 className="h-3 w-3" style={{ color: "var(--accent)" }} />
                        </button>
                      )}
                    </div>
                  </div>
                  <div style={{ fontSize: 12.5, color: "var(--ink-2)", lineHeight: 1.45 }}>
                    <MentionBody body={c.body} />
                  </div>
                </div>
              );
            })}
            <div ref={listEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div style={{ borderTop: "1px solid var(--border)", padding: "8px 8px 10px", flexShrink: 0 }}>
        <MentionInput
          value={body}
          onChange={setBody}
          onSubmit={handleSubmit}
          members={mentionMembers}
          placeholder="Add a comment… type @ to mention"
          disabled={submitting}
        />
        {error && (
          <div style={{ fontSize: 11.5, color: "var(--accent)", marginTop: 4 }}>{error}</div>
        )}
        <div className="row-between" style={{ marginTop: 6 }}>
          <span className="muted" style={{ fontSize: 10.5 }}>↵ to send · @ to mention</span>
          <button
            onClick={handleSubmit}
            disabled={!body.trim() || submitting}
            className="btn primary"
            style={{ height: 28, padding: "0 12px", fontSize: 12 }}
          >
            <Send className="h-3 w-3" />
            <span>Send</span>
          </button>
        </div>
      </div>
    </div>
  );
}
