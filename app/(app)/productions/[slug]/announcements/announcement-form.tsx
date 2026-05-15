"use client";

import { useState, useTransition, useRef } from "react";
import { Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
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
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="mb-6 rounded-lg border border-[color:var(--border)] p-4"
    >
      <h2 className="mb-3 text-sm font-semibold">Post Announcement</h2>
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-[color:var(--muted-foreground)]">
            Title
          </label>
          <input
            type="text"
            name="title"
            required
            className="w-full rounded-md border border-[color:var(--border)] bg-transparent px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]"
            placeholder="e.g. Production meeting Thursday 7pm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-[color:var(--muted-foreground)]">
            Details (optional)
          </label>
          <RichTextEditor
            content={body}
            onChange={setBody}
            placeholder="Add more details..."
            members={members}
          />
        </div>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <Button type="submit" disabled={isPending} size="sm">
          <Megaphone className="h-4 w-4" aria-hidden />
          {isPending ? "Posting..." : "Post"}
        </Button>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-green-600">Announcement posted.</p>}
      </div>
    </form>
  );
}
