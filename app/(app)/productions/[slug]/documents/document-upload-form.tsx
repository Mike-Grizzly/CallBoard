"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload, ScanText } from "lucide-react";
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

export function DocumentUploadForm({
  productionId,
  folders,
}: {
  productionId: string;
  folders: DocumentFolder[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const [file, setFile] = useState<File | null>(null);

  // After a scanned script is uploaded, we offer to OCR it into a searchable
  // PDF (set as the default script). This holds that pending offer.
  const [scan, setScan] = useState<{ file: File; title: string } | null>(null);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [ocrProgress, setOcrProgress] = useState<RebuildProgress | null>(null);
  const [ocrRunning, setOcrRunning] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setScan(null);
    setOcrError(null);

    const formData = new FormData(e.currentTarget);
    const title = ((formData.get("title") as string) ?? "").trim();
    const documentType = (formData.get("document_type") as string) || "general";
    const folderId = (formData.get("folder_id") as string) || null;

    if (!file || file.size === 0) {
      setError("Please select a file to upload.");
      return;
    }
    if (!title) {
      setError("Title is required.");
      return;
    }

    startTransition(async () => {
      const signed = await requestDocumentUpload(
        productionId,
        file.name,
        file.type,
        file.size,
      );
      if (signed.error || !signed.path || !signed.token) {
        setError(signed.error ?? "Could not start upload.");
        return;
      }

      const uploaded = await uploadFileToSignedUrl(
        signed.path,
        signed.token,
        file,
      );
      if (uploaded.error) {
        setError(uploaded.error);
        return;
      }

      const result = await finalizeDocumentUpload({
        productionId,
        storagePath: signed.path,
        title,
        folderId,
        documentType,
        fileName: file.name,
        fileSize: file.size,
        contentType: file.type,
      });
      if (result.error) {
        setError(result.error);
        return;
      }

      formRef.current?.reset();
      setFile(null);
      // A scanned script (image-only PDF or a bare image) has no text layer —
      // offer to make it searchable now, the way Adobe prompts for OCR.
      if (documentType === "script" && (await needsScriptOcr(file))) {
        setScan({ file, title });
      } else {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
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
      setSuccess(true);
      router.refresh();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setOcrError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setOcrRunning(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit}>
      <div className="h-eyebrow" style={{ marginBottom: 10 }}>
        Upload Document
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
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
      </div>
      <div style={{ marginTop: 10 }}>
        <label
          style={{
            display: "block",
            fontSize: 12,
            fontWeight: 500,
            color: "var(--ink-3)",
            marginBottom: 4,
          }}
        >
          File (max 64MB)
        </label>
        <FileDropzone
          onFile={setFile}
          selectedLabel={file?.name ?? null}
          disabled={isPending}
        />
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
                  setSuccess(true);
                  setTimeout(() => setSuccess(false), 3000);
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
    </form>
  );
}
