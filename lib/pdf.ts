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
    return pdfjsLib.getDocument(url).promise;
  })();

  // Drop a failed load so a later attempt can retry instead of replaying the error.
  loading.catch(() => pdfDocumentCache.delete(url));
  pdfDocumentCache.set(url, loading);
  return loading;
}
