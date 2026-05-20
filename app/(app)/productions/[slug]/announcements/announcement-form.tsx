"use client";

import { useState, useTransition, useRef } from "react";
import { Megaphone } from "lucide-react";
import { RichTextEditor } from "@/components/ui/rich-text-editor-lazy";
import type { MentionMember } from "@/components/ui/mention-textarea";
import { createAnnouncement } from "@/features/announcements/actions";

interface AnnouncementFormProps {
  productionId: string;
  members?: MentionMember[];
}

export function AnnouncementForm({ productionId, members }: AnnouncementFormProps) {
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    formData.set("production_id", productionId);
    formData.set("body", body);

    startTransition(async () => {
      const result = await createAnnouncement(formData);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        setBody("");
        formRef.current?.reset();
        setTimeout(() => setSuccess(false), 3000);
      }
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="card card-pad">
      <h2 className="h-card" style={{ marginBottom: 12 }}>
        Post announcement
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div>
          <label className="label">Title</label>
          <input
            type="text"
            name="title"
            required
            className="field"
            placeholder="e.g. Production meeting Thursday 7pm"
          />
        </div>
        <div>
          <label className="label">Details (optional)</label>
          <RichTextEditor
            content={body}
            onChange={setBody}
            placeholder="Add more details..."
            members={members}
          />
        </div>
      </div>
      <div className="row" style={{ gap: 12, marginTop: 12 }}>
        <button type="submit" className="btn primary" disabled={isPending}>
          <Megaphone size={14} aria-hidden />
          <span>{isPending ? "Posting..." : "Post"}</span>
        </button>
        {error && (
          <span style={{ fontSize: 13, color: "var(--accent)" }}>{error}</span>
        )}
        {success && (
          <span style={{ fontSize: 13, color: "var(--c-sage)" }}>
            Announcement posted.
          </span>
        )}
      </div>
    </form>
  );
}
