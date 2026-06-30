"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  ScanText,
  X,
  FileText,
  Image as ImageIcon,
  File as FileIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  requestDocumentUpload,
  finalizeDocumentUpload,
} from "@/features/documents/actions";
import { uploadFileToSignedUrl } from "@/lib/storage-upload";
import { needsScriptOcr } from "@/lib/pdf-scan-detect";
import { loadPdfDocument } from "@/lib/pdf";
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
// Above this many rows the list scrolls — show the count + a scroll hint.
const SCROLL_AFTER = 4;
const THUMB_W = 96;
const REMOVE_MS = 200;

type RowStatus = "pending" | "uploading" | "done" | "error";

type UploadRow = {
  id: string;
  file: File;
  title: string;
  documentType: string;
  folderId: string;
  status: RowStatus;
  error?: string;
  /** Preview data URL. undefined = not generated; "" = not previewable. */
  thumbUrl?: string;
};

function stripExt(name: string): string {
  return name.replace(/\.[^.]+$/, "");
}

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Render a small preview for images/PDFs as a data URL, or null if neither. */
async function makeThumb(file: File): Promise<string | null> {
  try {
    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      try {
        const img = document.createElement("img");
        await new Promise<void>((res, rej) => {
          img.onload = () => res();
          img.onerror = () => rej(new Error("decode failed"));
          img.src = url;
        });
        const w = THUMB_W;
        const h = Math.max(
          1,
          Math.round((img.naturalHeight / (img.naturalWidth || w)) * w),
        );
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return null;
        ctx.drawImage(img, 0, 0, w, h);
        return canvas.toDataURL("image/png");
      } finally {
        URL.revokeObjectURL(url);
      }
    }
    if (file.type === "application/pdf") {
      const url = URL.createObjectURL(file);
      try {
        const pdf = await loadPdfDocument(url);
        const page = await pdf.getPage(1);
        const base = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: THUMB_W / base.width });
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.ceil(viewport.width));
        canvas.height = Math.max(1, Math.ceil(viewport.height));
        await page.render({ canvas, viewport }).promise;
        return canvas.toDataURL("image/png");
      } finally {
        URL.revokeObjectURL(url);
      }
    }
  } catch {
    return null;
  }
  return null;
}

function ThumbIcon({ file }: { file: File }) {
  const Ico = file.type.startsWith("image/")
    ? ImageIcon
    : file.type === "application/pdf"
      ? FileText
      : FileIcon;
  return <Ico size={18} aria-hidden style={{ color: "var(--ink-4)" }} />;
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
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [removing, setRemoving] = useState<Set<string>>(new Set());
  const [notice, setNotice] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const thumbTried = useRef<Set<string>>(new Set());

  // After a scanned script is uploaded, we offer to OCR it into a searchable
  // PDF. Kept for the common single-script upload; bulk uploads skip the prompt.
  const [scan, setScan] = useState<{ file: File; title: string } | null>(null);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [ocrProgress, setOcrProgress] = useState<RebuildProgress | null>(null);
  const [ocrRunning, setOcrRunning] = useState(false);

  // Generate a preview once per row (best-effort; "" marks an attempt that
  // produced nothing, so we fall back to a file-type icon and don't retry).
  useEffect(() => {
    for (const row of rows) {
      if (row.thumbUrl !== undefined || thumbTried.current.has(row.id)) continue;
      thumbTried.current.add(row.id);
      makeThumb(row.file).then((url) =>
        updateRow(row.id, { thumbUrl: url ?? "" }),
      );
    }
  }, [rows]);

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

  function dropRows(ids: Set<string>) {
    setRows((prev) => prev.filter((r) => !ids.has(r.id)));
    setRemoving((prev) => {
      const n = new Set(prev);
      ids.forEach((id) => n.delete(id));
      return n;
    });
  }

  // Animate out, then drop. Skips rows mid-upload.
  function removeRows(ids: string[]) {
    const removable = ids.filter((id) => {
      const r = rows.find((x) => x.id === id);
      return r && r.status !== "uploading";
    });
    if (removable.length === 0) return;
    const set = new Set(removable);
    setSelected((prev) => {
      const n = new Set(prev);
      removable.forEach((id) => n.delete(id));
      return n;
    });
    setRemoving((prev) => new Set([...prev, ...removable]));
    window.setTimeout(() => dropRows(set), REMOVE_MS);
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  const editableRows = rows.filter((r) => r.status === "pending" || r.status === "error");
  const allSelected =
    editableRows.length > 0 && editableRows.every((r) => selected.has(r.id));

  function toggleSelectAll() {
    setSelected(allSelected ? new Set() : new Set(editableRows.map((r) => r.id)));
  }

  function bulkSet(patch: Partial<UploadRow>) {
    setRows((prev) =>
      prev.map((r) =>
        selected.has(r.id) && r.status !== "uploading" && r.status !== "done"
          ? { ...r, ...patch }
          : r,
      ),
    );
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
      setSelected(new Set());
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
  const selCount = selected.size;
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
          {/* List header: select-all + count + scroll hint */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 12,
              marginBottom: 6,
              fontSize: 12,
              color: "var(--ink-3)",
            }}
          >
            <label
              style={{ display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer" }}
            >
              <input
                type="checkbox"
                checked={allSelected}
                disabled={editableRows.length === 0}
                onChange={toggleSelectAll}
                aria-label="Select all files"
              />
              <span>
                {rows.length} file{rows.length === 1 ? "" : "s"}
              </span>
            </label>
            {rows.length > SCROLL_AFTER && (
              <span style={{ color: "var(--ink-4)" }}>· scroll to see all</span>
            )}
          </div>

          {/* Bulk action bar — appears when ≥1 row is selected */}
          {selCount > 0 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 8,
                padding: "8px 10px",
                marginBottom: 8,
                border: "1px solid var(--accent)",
                borderRadius: "var(--radius-s)",
                background: "var(--accent-soft)",
                fontSize: 12.5,
              }}
            >
              <b style={{ color: "var(--accent-ink, var(--accent))" }}>
                {selCount} selected
              </b>
              <select
                value=""
                onChange={(e) => e.target.value && bulkSet({ folderId: e.target.value === "__none" ? "" : e.target.value })}
                style={{ ...fieldStyle, width: "auto" }}
                aria-label="Set folder for selected"
              >
                <option value="">Set folder…</option>
                <option value="__none">— No folder —</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
              <select
                value=""
                onChange={(e) => e.target.value && bulkSet({ documentType: e.target.value })}
                style={{ ...fieldStyle, width: "auto" }}
                aria-label="Set type for selected"
              >
                <option value="">Set type…</option>
                {DOCUMENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => removeRows([...selected])}
                style={{
                  fontSize: 12.5,
                  color: "var(--c-clay)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Remove
              </button>
              <button
                type="button"
                onClick={() => setSelected(new Set())}
                style={{
                  marginLeft: "auto",
                  fontSize: 12.5,
                  color: "var(--ink-3)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Clear selection
              </button>
            </div>
          )}

          {/* Scrollable file list with a bottom fade when it overflows */}
          <div style={{ position: "relative" }}>
            <div
              style={{
                maxHeight: 320,
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: 8,
                paddingRight: 4,
              }}
            >
              {rows.map((row) => {
                const locked = row.status === "uploading" || row.status === "done";
                const isRemoving = removing.has(row.id);
                const checked = selected.has(row.id);
                return (
                  <div
                    key={row.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "auto 40px 1.5fr 1fr 1fr auto",
                      gap: 8,
                      alignItems: "start",
                      padding: isRemoving ? "0 10px" : "8px 10px",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-s)",
                      background: checked ? "var(--bg-sunken)" : "var(--bg-elev)",
                      opacity: isRemoving ? 0 : row.status === "done" ? 0.55 : 1,
                      maxHeight: isRemoving ? 0 : 200,
                      transform: isRemoving ? "translateX(24px)" : "none",
                      overflow: "hidden",
                      transition:
                        "opacity .2s ease, transform .2s ease, max-height .2s ease, padding .2s ease",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={locked}
                      onChange={() => toggleSelect(row.id)}
                      aria-label={`Select ${row.title || row.file.name}`}
                      style={{ marginTop: 4 }}
                    />
                    {/* Thumbnail / file-type icon */}
                    <div
                      style={{
                        width: 40,
                        height: 52,
                        borderRadius: 4,
                        border: "1px solid var(--border)",
                        background: "var(--bg-sunken)",
                        display: "grid",
                        placeItems: "center",
                        overflow: "hidden",
                        flexShrink: 0,
                      }}
                    >
                      {row.thumbUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={row.thumbUrl}
                          alt=""
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        <ThumbIcon file={row.file} />
                      )}
                    </div>
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
                      style={{ display: "flex", alignItems: "center", gap: 6, paddingTop: 2 }}
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
                        onClick={() => removeRows([row.id])}
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
            {rows.length > SCROLL_AFTER && (
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: 24,
                  pointerEvents: "none",
                  background:
                    "linear-gradient(to bottom, transparent, var(--bg-elev))",
                }}
              />
            )}
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
                  setSelected(new Set());
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
