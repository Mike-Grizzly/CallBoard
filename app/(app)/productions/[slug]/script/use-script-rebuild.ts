"use client";

import { useCallback, useRef, useState } from "react";
import {
  rebuildScanAsSearchablePdf,
  type RebuildProgress,
} from "@/lib/pdf-ocr-rebuild";
import {
  createRebuiltScriptUploadUrl,
  finalizeRebuiltScript,
} from "@/features/scripts/ocr-actions";
import { uploadFileToSignedUrl } from "@/lib/storage-upload";

export type RebuildStatus =
  | "idle"
  | "running" // rendering + OCR'ing pages
  | "uploading" // assembled, sending to storage + finalizing
  | "done"
  | "failed";

interface Args {
  productionId: string;
  pdfUrl: string;
  title: string;
  fileName: string;
}

/**
 * Rebuilds the current (unrenderable) scan into a searchable PDF in the browser
 * and installs it as the production's new default script. The page should
 * `router.refresh()` on `done` to pick up the new file.
 */
export function useScriptRebuild({ productionId, pdfUrl, title, fileName }: Args) {
  const [status, setStatus] = useState<RebuildStatus>("idle");
  const [progress, setProgress] = useState<RebuildProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cancelRef = useRef({ cancelled: false });

  const cancel = useCallback(() => {
    cancelRef.current.cancelled = true;
  }, []);

  const run = useCallback(async () => {
    setError(null);
    setProgress(null);
    cancelRef.current = { cancelled: false };
    setStatus("running");
    try {
      const bytes = await (await fetch(pdfUrl)).arrayBuffer();
      const blob = await rebuildScanAsSearchablePdf(bytes, {
        onProgress: setProgress,
        signal: cancelRef.current,
      });
      if (cancelRef.current.cancelled) {
        setStatus("idle");
        return;
      }

      setStatus("uploading");
      const base = (fileName || "script").replace(/\.pdf$/i, "");
      const outName = `${base}-searchable.pdf`;

      const signed = await createRebuiltScriptUploadUrl({
        productionId,
        fileName: outName,
      });
      if (signed.error || !signed.path || !signed.token) {
        throw new Error(signed.error || "Upload could not start.");
      }

      const file = new File([blob], outName, { type: "application/pdf" });
      const up = await uploadFileToSignedUrl(signed.path, signed.token, file);
      if (up.error) throw new Error(up.error);

      const fin = await finalizeRebuiltScript({
        productionId,
        storagePath: signed.path,
        title: title ? `${title} (searchable)` : "Script (searchable)",
        fileName: outName,
        fileSize: blob.size,
      });
      if (fin.error) throw new Error(fin.error);

      setStatus("done");
    } catch (e) {
      if (cancelRef.current.cancelled) {
        setStatus("idle");
        return;
      }
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setStatus("failed");
    }
  }, [productionId, pdfUrl, title, fileName]);

  return { status, progress, error, run, cancel };
}
