"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { loadPdfDocument } from "@/lib/pdf";
import { ocrCanvas, ocrRenderScale, terminateOcrWorker } from "@/lib/ocr";
import {
  getScriptOcr,
  startScriptOcr,
  saveScriptOcrPages,
  failScriptOcr,
} from "@/features/scripts/ocr-actions";
import type { OcrPage, OcrWord } from "@/features/scripts/constants";

export type OcrUiStatus =
  | "idle" // not scanned, or not yet checked
  | "checking" // querying for an existing OCR result
  | "prompt" // scanned + no OCR yet → offer to run
  | "running"
  | "ready"
  | "failed"
  | "declined";

interface Args {
  pdfUrl: string;
  storagePath: string;
  scriptVersion: number;
  documentId: string;
  /** null = not yet determined. */
  isScanned: boolean | null;
  /** Gate the check/run on a member who is allowed to view the script. */
  enabled: boolean;
}

// Flush OCR'd pages to the shared row every N pages so a long run isn't lost if
// the tab closes partway, and so other viewers see progress.
const SAVE_EVERY = 5;

function pagesToMap(pages: OcrPage[]): Map<number, OcrWord[]> {
  const m = new Map<number, OcrWord[]>();
  for (const p of pages) m.set(p.page, p.words);
  return m;
}

/**
 * Drives in-browser OCR for a scanned script: detects an existing shared
 * result, or runs tesseract.js page-by-page (with progress) and persists the
 * result for the whole production. The viewer paints `pages` as its text layer.
 */
export function useScriptOcr({
  pdfUrl,
  storagePath,
  scriptVersion,
  documentId,
  isScanned,
  enabled,
}: Args) {
  const [status, setStatus] = useState<OcrUiStatus>("idle");
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(
    null,
  );
  const [pages, setPages] = useState<Map<number, OcrWord[]>>(new Map());
  const cancelRef = useRef(false);

  const dismissKey = `ocr-dismissed:${storagePath}:${scriptVersion}`;

  // Check for an existing shared OCR result once the file reads as scanned.
  useEffect(() => {
    if (!enabled || isScanned !== true || !storagePath) return;
    let active = true;
    setStatus("checking");
    getScriptOcr(storagePath, scriptVersion)
      .then((res) => {
        if (!active) return;
        if (res && res.status === "ready" && res.pages.length > 0) {
          setPages(pagesToMap(res.pages));
          setStatus("ready");
          return;
        }
        let dismissed = false;
        try {
          dismissed = window.localStorage.getItem(dismissKey) === "1";
        } catch {
          /* private mode */
        }
        setStatus(dismissed ? "declined" : "prompt");
      })
      .catch(() => {
        if (active) setStatus("prompt");
      });
    return () => {
      active = false;
    };
  }, [enabled, isScanned, storagePath, scriptVersion, dismissKey]);

  const decline = useCallback(() => {
    try {
      window.localStorage.setItem(dismissKey, "1");
    } catch {
      /* ignore */
    }
    setStatus("declined");
  }, [dismissKey]);

  const cancel = useCallback(() => {
    cancelRef.current = true;
  }, []);

  const run = useCallback(async () => {
    cancelRef.current = false;
    setStatus("running");
    setProgress({ current: 0, total: 0 });

    let ocrId: string | undefined;
    try {
      const claim = await startScriptOcr({ storagePath, scriptVersion, documentId });
      if (claim.error) throw new Error(claim.error);

      // Another viewer finished it between the check and now — just load it.
      if (claim.status === "ready") {
        const res = await getScriptOcr(storagePath, scriptVersion);
        if (res?.status === "ready" && res.pages.length > 0) {
          setPages(pagesToMap(res.pages));
          setStatus("ready");
          return;
        }
      }

      ocrId = claim.ocrId;
      if (!ocrId) throw new Error("Could not start OCR.");

      const pdf = await loadPdfDocument(pdfUrl);
      const total = pdf.numPages;
      setProgress({ current: 0, total });

      const collected = new Map<number, OcrWord[]>();
      let batch: OcrPage[] = [];

      for (let n = 1; n <= total; n += 1) {
        if (cancelRef.current) break;

        const page = await pdf.getPage(n);
        const base = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({
          scale: ocrRenderScale(base.width, base.height),
        });
        const canvas = document.createElement("canvas");
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        await page.render({ canvas, viewport }).promise;

        const words = await ocrCanvas(canvas);
        canvas.width = 0; // free the backing store
        canvas.height = 0;

        collected.set(n, words);
        batch.push({ page: n, words });
        setPages(new Map(collected));
        setProgress({ current: n, total });

        if (batch.length >= SAVE_EVERY || n === total) {
          await saveScriptOcrPages({ ocrId, pages: batch, pageCount: total, done: false });
          batch = [];
        }
      }

      if (cancelRef.current) {
        // Partial result is saved (still `processing`); reopen to resume.
        setStatus("prompt");
        return;
      }

      await saveScriptOcrPages({ ocrId, pages: [], pageCount: total, done: true });
      setStatus("ready");
    } catch {
      if (ocrId) {
        try {
          await failScriptOcr(ocrId);
        } catch {
          /* best-effort */
        }
      }
      setStatus("failed");
    } finally {
      void terminateOcrWorker();
    }
  }, [pdfUrl, storagePath, scriptVersion, documentId]);

  return { status, progress, pages, run, decline, cancel };
}
