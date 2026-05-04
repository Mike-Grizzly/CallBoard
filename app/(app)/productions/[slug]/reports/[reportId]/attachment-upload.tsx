"use client";

import { useState, useTransition } from "react";
import { uploadReportAttachment } from "@/features/reports/attachments";
import { Paperclip } from "lucide-react";

export function AttachmentUpload({ reportId }: { reportId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccess(false);

    const formData = new FormData();
    formData.set("report_id", reportId);
    formData.set("file", file);

    startTransition(async () => {
      const result = await uploadReportAttachment(formData);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        e.target.value = "";
        setTimeout(() => setSuccess(false), 3000);
      }
    });
  }

  return (
    <div>
      <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-[color:var(--border)] bg-transparent px-3 py-1.5 text-sm font-medium transition-colors hover:bg-[color:var(--accent)]">
        <Paperclip className="h-4 w-4" aria-hidden />
        {isPending ? "Uploading..." : "Attach file"}
        <input
          type="file"
          className="hidden"
          onChange={handleUpload}
          disabled={isPending}
        />
      </label>
      <p className="mt-1 text-xs text-[color:var(--muted-foreground)]">
        Max 10MB per file
      </p>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      {success && (
        <p className="mt-1 text-sm text-green-600">File uploaded.</p>
      )}
    </div>
  );
}
