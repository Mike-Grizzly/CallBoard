"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Upload, ScanText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  requestDocumentUpload,
  finalizeDocumentUpload,
} from "@/features/documents/actions";
import { uploadFileToSignedUrl } from "@/lib/storage-upload";
import { needsScriptOcr } from "@/lib/pdf-scan-detect";
import {
  installSearchableScript,
  type RebuildProgress,
} from "@/lib/install-searchable-script";
import { DOCUMENT_TYPES } from "@/features/documents/constants";
import type { DocumentFolder } from "@/features/documents/queries";
import { FileDropzone } from "@/components/ui/file-dropzone";

// Guardrails so a careless drag doesn't spawn hundreds of rows or a multi-GB
// upload. Per-file matches the storage bucket's 64MB limit.
const MAX_FILES = 20;
const MAX_FILE_BYTES = 64 * 1024 * 1024;
const MAX_TOTAL_BYTES = 200 * 1024 * 1024;

type RowStatus = "pending" | "uploading" | "done" | "error";

type UploadRow = {
  id: string;
  file: File;
  title: string;
  documentType: string;
  folderId: string;
  status: RowStatus;
  error?: string;
};

function stripExt(name: string): string {
  return name.replace(/\.[^.]+$/, "");
}

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentUploadForm({
  productionId,
  folders,
}: {
  productionId: string;
  folders: DocumentFolder[];
}) {
  const router = useRouter();
  const [rows, setRows] = useState<UploadRow[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // After a scanned script is uploaded, we offer to OCR it into a searchable
  // PDF. Kept for the common single-script upload; bulk uploads skip the prompt.
  const [scan, setScan] = useState<{ file: File; title: string } | null>(null);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [ocrProgress, setOcrProgress] = useState<RebuildProgress | null>(null);
  const [ocrRunning, setOcrRunning] = useState(false);

  function addFiles(files: File[]) {
    setNotice(null);
    setSuccess(null);
    setScan(null);
    setRows((prev) => {
      const next = [...prev];
      let total = prev.reduce((sum, r) => sum + r.file.size, 0);
      let skipped = 0;
      for (const file of files) {
        if (
          next.length >= MAX_FILES ||
          file.size === 0 ||
          file.size > MAX_FILE_BYTES ||
          total + file.size > MAX_TOTAL_BYTES
        ) {
          skipped++;
          continue;
        }
        total += file.size;
        next.push({
          id: crypto.randomUUID(),
          file,
          title: stripExt(file.name),
          documentType: "general",
          folderId: "",
          status: "pending",
        });
      }
      if (skipped > 0) {
        setNotice(
          `Some files were skipped — the limit is ${MAX_FILES} files, ${formatSize(MAX_FILE_BYTES)} each, ${formatSize(MAX_TOTAL_BYTES)} total.`,
        );
      }
      return next;
    });
  }

  function updateRow(id: string, patch: Partial<UploadRow>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function removeRow(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  function handleUpload() {
    setNotice(null);
    setSuccess(null);
    const toUpload = rows.filter((r) => r.status !== "done");
    if (toUpload.length === 0) return;

    startTransition(async () => {
      let uploaded = 0;
      for (const row of toUpload) {
        updateRow(row.id, { status: "uploading", error: undefined });
        const title = row.title.trim() || stripExt(row.file.name);
        const signed = await requestDocumentUpload(
          productionId,
          row.file.name,
          row.file.type,
          row.file.size,
        );
        if (signed.error || !signed.path || !signed.token) {
          updateRow(row.id, {
            status: "error",
            error: signed.error ?? "Could not start upload.",
          });
          continue;
        }
        const up = await uploadFileToSignedUrl(signed.path, signed.token, row.file);
        if (up.error) {
          updateRow(row.id, { status: "error", error: up.error });
          continue;
        }
        const result = await finalizeDocumentUpload({
          productionId,
          storagePath: signed.path,
          title,
          folderId: row.folderId || null,
          documentType: row.documentType,
          fileName: row.file.name,
          fileSize: row.file.size,
          contentType: row.file.type,
        });
        if (result.error) {
          updateRow(row.id, { status: "error", error: result.error });
          continue;
        }
        updateRow(row.id, { status: "done" });
        uploaded++;
      }

      // Clear the rows that uploaded cleanly; leave failures for retry.
      setRows((prev) => prev.filter((r) => r.status === "error"));
      router.refresh();

      // Single scanned-script convenience: offer OCR like before. Bulk uploads
      // skip this — scripts can still be made searchable from the Script tool.
      const lone = toUpload.length === 1 ? toUpload[0] : null;
      if (
        lone &&
        lone.documentType === "script" &&
        (await needsScriptOcr(lone.file))
      ) {
        setScan({
          file: lone.file,
          title: lone.title.trim() || stripExt(lone.file.name),
        });
      } else if (uploaded > 0) {
        setSuccess(`Uploaded ${uploaded} file${uploaded === 1 ? "" : "s"}.`);
        setTimeout(() => setSuccess(null), 3000);
      }
    });
  }

  async function runOcr() {
    if (!scan) return;
    setOcrError(null);
    setOcrProgress(null);
    setOcrRunning(true);
    try {
      const res = await installSearchableScript({
        productionId,
        file: scan.file,
        baseName: scan.file.name,
        title: scan.title,
        onProgress: setOcrProgress,
      });
      if (res.error) {
        setOcrError(res.error);
        return;
      }
      setScan(null);
      setSuccess("Document uploaded.");
      router.refresh();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setOcrError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setOcrRunning(false);
    }
  }

  const pendingCount = rows.filter((r) => r.status !== "done").length;
  const fieldStyle: React.CSSProperties = {
    width: "100%",
    borderRadius: "var(--radius-s)",
    border: "1px solid var(--border)",
    background: "var(--bg-elev)",
    padding: "4px 8px",
    fontSize: 12.5,
    color: "var(--ink)",
    outline: "none",
  };

  return (
    <div>
      <div className="h-eyebrow" style={{ marginBottom: 10 }}>
        Upload Documents
      </div>

      <FileDropzone
        multiple
        onFiles={addFiles}
        disabled={isPending}
        hint="Drag files here, or click to browse"
      />

      {notice && (
        <p style={{ fontSize: 12.5, color: "var(--ink-3)", marginTop: 8 }}>
          {notice}
        </p>
      )}

      {rows.length > 0 && (
        <>
          <div
            style={{
              marginTop: 12,
              maxHeight: 280,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 8,
              paddingRight: 4,
            }}
          >
            {rows.map((row) => {
              const locked = row.status === "uploading" || row.status === "done";
              return (
                <div
                  key={row.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.5fr 1fr 1fr auto",
                    gap: 8,
                    // Top-align so the filename/size caption under the title
                    // input doesn't shove the Type/Folder selects out of line.
                    alignItems: "start",
                    padding: "8px 10px",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-s)",
                    background: "var(--bg-elev)",
                    opacity: row.status === "done" ? 0.55 : 1,
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <input
                      type="text"
                      value={row.title}
                      placeholder="Title"
                      disabled={locked}
                      onChange={(e) => updateRow(row.id, { title: e.target.value })}
                      style={{ ...fieldStyle, background: "transparent" }}
                    />
                    <div
                      style={{
                        fontSize: 11,
                        color:
                          row.status === "error"
                            ? "var(--c-clay)"
                            : "var(--ink-4)",
                        marginTop: 2,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {row.file.name} · {formatSize(row.file.size)}
                      {row.status === "error" && row.error
                        ? ` · ${row.error}`
                        : ""}
                    </div>
                  </div>
                  <select
                    value={row.documentType}
                    disabled={locked}
                    onChange={(e) =>
                      updateRow(row.id, { documentType: e.target.value })
                    }
                    style={fieldStyle}
                  >
                    {DOCUMENT_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={row.folderId}
                    disabled={locked}
                    onChange={(e) =>
                      updateRow(row.id, { folderId: e.target.value })
                    }
                    style={fieldStyle}
                  >
                    <option value="">— No folder —</option>
                    {folders.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 6 }}
                  >
                    {row.status === "uploading" && (
                      <span style={{ fontSize: 11, color: "var(--ink-3)" }}>
                        Uploading…
                      </span>
                    )}
                    {row.status === "done" && (
                      <span style={{ fontSize: 11, color: "var(--c-sage)" }}>
                        Done
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeRow(row.id)}
                      disabled={row.status === "uploading"}
                      aria-label="Remove file"
                      style={{
                        display: "inline-flex",
                        padding: 4,
                        background: "none",
                        border: "none",
                        color: "var(--ink-3)",
                        cursor:
                          row.status === "uploading" ? "default" : "pointer",
                      }}
                    >
                      <X size={14} aria-hidden />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="row" style={{ gap: 10, marginTop: 10 }}>
            <Button
              type="button"
              onClick={handleUpload}
              disabled={isPending || pendingCount === 0}
              size="sm"
            >
              <Upload className="h-4 w-4" aria-hidden />
              {isPending
                ? "Uploading…"
                : `Upload ${pendingCount} file${pendingCount === 1 ? "" : "s"}`}
            </Button>
            {!isPending && (
              <button
                type="button"
                onClick={() => {
                  setRows([]);
                  setNotice(null);
                }}
                style={{
                  fontSize: 13,
                  color: "var(--ink-3)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Clear
              </button>
            )}
            {success && (
              <p style={{ fontSize: 13, color: "var(--c-sage)" }}>{success}</p>
            )}
          </div>
        </>
      )}

      {rows.length === 0 && success && (
        <p style={{ fontSize: 13, color: "var(--c-sage)", marginTop: 10 }}>
          {success}
        </p>
      )}

      {scan && (
        <div
          style={{
            marginTop: 12,
            padding: 12,
            border: "1px solid var(--border)",
            borderRadius: 8,
            background: "var(--bg-sunken)",
            display: "flex",
            gap: 10,
            alignItems: "flex-start",
          }}
        >
          <ScanText
            size={18}
            style={{ color: "var(--accent)", flexShrink: 0, marginTop: 1 }}
            aria-hidden
          />
          <div style={{ flex: 1, fontSize: 13, color: "var(--ink-2)" }}>
            {ocrRunning ? (
              <>
                Making &ldquo;{scan.title}&rdquo; searchable&hellip;{" "}
                {ocrProgress
                  ? `${
                      ocrProgress.phase === "ocr" ? "reading" : "rendering"
                    } page ${ocrProgress.page} of ${ocrProgress.total}`
                  : "starting"}
                . This can take a few minutes — keep this tab open.
                {ocrProgress && ocrProgress.total > 0 && (
                  <div
                    style={{
                      marginTop: 6,
                      height: 4,
                      borderRadius: 2,
                      background: "var(--border)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${Math.round(
                          (ocrProgress.page / ocrProgress.total) * 100,
                        )}%`,
                        background: "var(--accent)",
                        transition: "width .2s",
                      }}
                    />
                  </div>
                )}
              </>
            ) : (
              <>
                <strong>This looks like a scanned script</strong> with no
                searchable text. Make it searchable so the Script tool, search,
                and AI analysis can use it? It OCRs every page (a few minutes)
                and becomes the default script.
                {ocrError && (
                  <div style={{ marginTop: 6, color: "var(--c-clay)" }}>
                    {ocrError}
                  </div>
                )}
              </>
            )}
          </div>
          {!ocrRunning && (
            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              <Button type="button" size="sm" onClick={runOcr}>
                <ScanText className="h-4 w-4" aria-hidden />
                {ocrError ? "Try again" : "Make searchable"}
              </Button>
              <button
                type="button"
                onClick={() => {
                  setScan(null);
                  setSuccess("Document uploaded.");
                  setTimeout(() => setSuccess(null), 3000);
                }}
                style={{
                  fontSize: 13,
                  color: "var(--ink-3)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Skip
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
