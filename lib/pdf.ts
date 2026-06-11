import type { PDFDocumentProxy } from "pdfjs-dist";

/**
 * Parsed PDF documents keyed by URL.
 *
 * Fetching and parsing a PDF is the expensive part of opening the script
 * and blocking viewers. Without this cache, every page turn and zoom
 * change re-downloads and re-parses the whole file. Caching the parsed
 * document means navigation only has to render a page, not reload the
 * document.
 */
const pdfDocumentCache = new Map<string, Promise<PDFDocumentProxy>>();

export async function loadPdfDocument(url: string): Promise<PDFDocumentProxy> {
  const cached = pdfDocumentCache.get(url);
  if (cached) return cached;

  const loading = (async () => {
    const pdfjsLib = await import("pdfjs-dist");
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.min.mjs",
      import.meta.url,
    ).toString();
    // Point pdfjs at the CMap + standard-font data we copy into public/ at
    // build time (scripts/copy-pdfjs-assets.mjs). Without these, text that
    // uses non-embedded fonts (Helvetica/Times/Arial — common in scripts)
    // renders blank while images still draw, so a PDF can look fine in the
    // browser's native viewer yet appear textless in this one.
    return pdfjsLib.getDocument({
      url,
      cMapUrl: "/pdfjs/cmaps/",
      cMapPacked: true,
      standardFontDataUrl: "/pdfjs/standard_fonts/",
    }).promise;
  })();

  // Drop a failed load so a later attempt can retry instead of replaying the error.
  loading.catch(() => pdfDocumentCache.delete(url));
  pdfDocumentCache.set(url, loading);
  return loading;
}
