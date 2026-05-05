"use client";

import { useState, useTransition, useRef } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadDocument, DOCUMENT_TYPES } from "@/features/documents/actions";

export function DocumentUploadForm({ productionId }: { productionId: string }) {
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

    startTransition(async () => {
      const result = await uploadDocument(formData);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
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
      <h2 className="mb-3 text-sm font-semibold">Upload Document</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-[color:var(--muted-foreground)]">
            Title
          </label>
          <input
            type="text"
            name="title"
            required
            className="w-full rounded-md border border-[color:var(--border)] bg-transparent px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]"
            placeholder="e.g. Act 1 Script"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-[color:var(--muted-foreground)]">
            Type
          </label>
          <select
            name="document_type"
            className="w-full rounded-md border border-[color:var(--border)] bg-transparent px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]"
          >
            {DOCUMENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-[color:var(--muted-foreground)]">
            File (max 25MB)
          </label>
          <input
            type="file"
            name="file"
            required
            className="w-full text-sm file:mr-2 file:rounded-md file:border-0 file:bg-[color:var(--accent)] file:px-3 file:py-1.5 file:text-sm file:font-medium"
          />
        </div>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <Button type="submit" disabled={isPending} size="sm">
          <Upload className="h-4 w-4" aria-hidden />
          {isPending ? "Uploading..." : "Upload"}
        </Button>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-green-600">Document uploaded.</p>}
      </div>
    </form>
  );
}
