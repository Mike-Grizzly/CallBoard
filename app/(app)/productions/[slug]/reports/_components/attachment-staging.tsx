"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import { getAttachmentUrl } from "@/features/reports/attachments";

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]);

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export type ExistingAttachment = {
  id: string;
  fileName: string;
  fileSize: number;
  contentType: string;
};

export function AttachmentStaging({
  staged,
  onStagedChange,
  existing,
  onRemoveExisting,
  disabled = false,
}: {
  staged: File[];
  onStagedChange: (files: File[]) => void;
  existing: ExistingAttachment[];
  onRemoveExisting: (id: string) => void;
  disabled?: boolean;
}) {
  const [error, setError] = useState<string | null>(null);

  function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    const files = Array.from(input.files ?? []);
    if (files.length === 0) return;

    const accepted: File[] = [];
    const rejected: string[] = [];
    for (const f of files) {
      if (f.size > MAX_FILE_BYTES) {
        rejected.push(`${f.name} (over 10 MB)`);
        continue;
      }
      if (f.type && !ALLOWED_MIME_TYPES.has(f.type)) {
        rejected.push(`${f.name} (unsupported file type)`);
        continue;
      }
      accepted.push(f);
    }

    setError(rejected.length > 0 ? `Skipped: ${rejected.join(", ")}` : null);
    onStagedChange([...staged, ...accepted]);
    input.value = "";
  }

  function removeStaged(idx: number) {
    onStagedChange(staged.filter((_, i) => i !== idx));
  }

  async function openExisting(id: string) {
    const url = await getAttachmentUrl(id);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  }

  const hasAny = staged.length > 0 || existing.length > 0;

  return (
    <div>
      {hasAny && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            marginBottom: 12,
          }}
        >
          {existing.map((a) => (
            <div
              key={a.id}
              className="row-between"
              style={{
                padding: "8px 12px",
                border: "1px solid var(--border)",
                borderRadius: 6,
                background: "var(--bg-elev)",
                fontSize: 13,
              }}
            >
              <div className="row" style={{ gap: 8, minWidth: 0, flex: 1 }}>
                <Icon name="Paperclip" size={13} aria-hidden />
                <button
                  type="button"
                  onClick={() => openExisting(a.id)}
                  className="truncate"
                  style={{
                    background: "transparent",
                    border: 0,
                    padding: 0,
                    textAlign: "left",
                    cursor: "pointer",
                    color: "var(--ink)",
                    minWidth: 0,
                  }}
                  title={a.fileName}
                >
                  {a.fileName}
                </button>
                <span style={{ color: "var(--ink-4)", flexShrink: 0 }}>
                  {formatFileSize(a.fileSize)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onRemoveExisting(a.id)}
                disabled={disabled}
                className="btn ghost btn-icon"
                aria-label={`Remove ${a.fileName}`}
                style={{ flexShrink: 0 }}
              >
                <Icon name="X" size={12} aria-hidden />
              </button>
            </div>
          ))}
          {staged.map((f, idx) => (
            <div
              key={`${f.name}-${idx}`}
              className="row-between"
              style={{
                padding: "8px 12px",
                border: "1px dashed var(--border)",
                borderRadius: 6,
                background: "transparent",
                fontSize: 13,
              }}
            >
              <div className="row" style={{ gap: 8, minWidth: 0, flex: 1 }}>
                <Icon name="Paperclip" size={13} aria-hidden />
                <span className="truncate" title={f.name} style={{ minWidth: 0 }}>
                  {f.name}
                </span>
                <span style={{ color: "var(--ink-4)", flexShrink: 0 }}>
                  {formatFileSize(f.size)}
                </span>
                <span
                  className="pill"
                  data-c="amber"
                  style={{ fontSize: 10, padding: "1px 6px", flexShrink: 0 }}
                >
                  pending
                </span>
              </div>
              <button
                type="button"
                onClick={() => removeStaged(idx)}
                disabled={disabled}
                className="btn ghost btn-icon"
                aria-label={`Remove ${f.name}`}
                style={{ flexShrink: 0 }}
              >
                <Icon name="X" size={12} aria-hidden />
              </button>
            </div>
          ))}
        </div>
      )}

      <label
        className="btn"
        style={{
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <Icon name="Paperclip" size={13} aria-hidden />
        <span>Attach file</span>
        <input
          type="file"
          multiple
          onChange={pick}
          disabled={disabled}
          style={{ display: "none" }}
        />
      </label>
      <p
        style={{
          marginTop: 6,
          fontSize: 12,
          color: "var(--ink-4)",
        }}
      >
        PDF, image, or Office document · Max 10 MB per file
        {staged.length > 0
          ? ` · ${staged.length} pending — will upload on save`
          : ""}
      </p>
      {error && (
        <p style={{ marginTop: 6, fontSize: 12, color: "var(--accent)" }}>
          {error}
        </p>
      )}
    </div>
  );
}
