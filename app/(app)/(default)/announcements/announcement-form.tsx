"use client";

import { useState, useTransition, useRef } from "react";
import { Megaphone } from "lucide-react";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { createAnnouncement } from "@/features/announcements/actions";

export function OrgAnnouncementForm() {
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
    // No production_id = org-wide
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
        Post org-wide announcement
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div>
          <label className="label">Title</label>
          <input
            type="text"
            name="title"
            required
            className="field"
            placeholder="e.g. Studio closed this Saturday"
          />
        </div>
        <div>
          <label className="label">Details (optional)</label>
          <RichTextEditor
            content={body}
            onChange={setBody}
            placeholder="Add more details..."
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
