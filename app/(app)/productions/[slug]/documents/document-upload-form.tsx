"use client";

import { useState, useTransition, useRef } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadDocument } from "@/features/documents/actions";
import { DOCUMENT_TYPES } from "@/features/documents/constants";
import type { DocumentFolder } from "@/features/documents/queries";

export function DocumentUploadForm({
  productionId,
  folders,
}: {
  productionId: string;
  folders: DocumentFolder[];
}) {
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
    <form ref={formRef} onSubmit={handleSubmit}>
      <div className="h-eyebrow" style={{ marginBottom: 10 }}>
        Upload Document
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr 1fr",
          gap: 10,
        }}
      >
        <div>
          <label
            style={{
              display: "block",
              fontSize: 12,
              fontWeight: 500,
              color: "var(--ink-3)",
              marginBottom: 4,
            }}
          >
            Title
          </label>
          <input
            type="text"
            name="title"
            required
            style={{
              width: "100%",
              borderRadius: "var(--radius-s)",
              border: "1px solid var(--border)",
              background: "transparent",
              padding: "6px 10px",
              fontSize: 13,
              color: "var(--ink)",
              outline: "none",
            }}
            placeholder="e.g. Act 1 Script"
          />
        </div>
        <div>
          <label
            style={{
              display: "block",
              fontSize: 12,
              fontWeight: 500,
              color: "var(--ink-3)",
              marginBottom: 4,
            }}
          >
            Type
          </label>
          <select
            name="document_type"
            defaultValue="general"
            style={{
              width: "100%",
              borderRadius: "var(--radius-s)",
              border: "1px solid var(--border)",
              background: "var(--bg-elev)",
              padding: "6px 10px",
              fontSize: 13,
              color: "var(--ink)",
              outline: "none",
            }}
          >
            {DOCUMENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            style={{
              display: "block",
              fontSize: 12,
              fontWeight: 500,
              color: "var(--ink-3)",
              marginBottom: 4,
            }}
          >
            Folder
          </label>
          <select
            name="folder_id"
            style={{
              width: "100%",
              borderRadius: "var(--radius-s)",
              border: "1px solid var(--border)",
              background: "var(--bg-elev)",
              padding: "6px 10px",
              fontSize: 13,
              color: "var(--ink)",
              outline: "none",
            }}
          >
            <option value="">— No folder —</option>
            {folders.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            style={{
              display: "block",
              fontSize: 12,
              fontWeight: 500,
              color: "var(--ink-3)",
              marginBottom: 4,
            }}
          >
            File (max 25MB)
          </label>
          <input
            type="file"
            name="file"
            required
            className="w-full text-sm file:mr-2 file:rounded-md file:border-0 file:bg-[color:var(--muted)] file:px-3 file:py-1.5 file:text-sm file:font-medium"
          />
        </div>
      </div>
      <div className="row" style={{ gap: 10, marginTop: 10 }}>
        <Button type="submit" disabled={isPending} size="sm">
          <Upload className="h-4 w-4" aria-hidden />
          {isPending ? "Uploading…" : "Upload"}
        </Button>
        {error && (
          <p style={{ fontSize: 13, color: "var(--c-clay)" }}>{error}</p>
        )}
        {success && (
          <p style={{ fontSize: 13, color: "var(--c-sage)" }}>
            Document uploaded.
          </p>
        )}
      </div>
    </form>
  );
}
