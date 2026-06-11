import { ocrCanvas, terminateOcrWorker } from "./ocr";

/**
 * Rebuild a scanned/image-only PDF into a SEARCHABLE PDF, entirely in the
 * browser.
 *
 * Why this exists: some scans (MRC / CCITT ImageMask scripts) render blank in
 * pdfjs — our viewer's engine — even though they're valid. pdfjs can't be used
 * to rasterize them, so we render each page with PDFium (the engine Chrome
 * uses, via WASM), OCR it with tesseract.js, and assemble a new PDF whose pages
 * are the rendered images plus an INVISIBLE text layer at each word's box.
 *
 * The result uses standard image codecs + a real text layer, so it renders and
 * is searchable everywhere (Script tool, Documents, AI parse, download) — the
 * automatic equivalent of running Adobe's "Recognize Text".
 *
 * Heavy and client-side: a long script takes minutes. Driven page-by-page with
 * progress + cancellation.
 */

export type RebuildPhase = "render" | "ocr";

export interface RebuildProgress {
  phase: RebuildPhase;
  page: number;
  total: number;
}

export interface RebuildOptions {
  onProgress?: (p: RebuildProgress) => void;
  /** Polled between pages; set `.cancelled = true` to stop early. */
  signal?: { cancelled: boolean };
}

// PDFium render scale. ~2.0 on a US-Letter page ≈ 144 dpi — enough detail for
// reliable OCR without exploding memory/output size on a long script.
const RENDER_SCALE = 2.0;
// JPEG quality for the page images embedded in the rebuilt PDF.
const PAGE_JPEG_QUALITY = 0.72;

/** BGRA bitmap (PDFium default) → an RGBA canvas. */
function bitmapToCanvas(
  data: Uint8Array,
  width: number,
  height: number,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas unavailable");
  const rgba = new Uint8ClampedArray(data.length);
  for (let i = 0; i < data.length; i += 4) {
    rgba[i] = data[i + 2]; // R ← B
    rgba[i + 1] = data[i + 1]; // G
    rgba[i + 2] = data[i]; // B ← R
    rgba[i + 3] = data[i + 3]; // A
  }
  ctx.putImageData(new ImageData(rgba, width, height), 0, 0);
  return canvas;
}

export async function rebuildScanAsSearchablePdf(
  fileBytes: ArrayBuffer | Uint8Array,
  options: RebuildOptions = {},
): Promise<Blob> {
  const { onProgress, signal } = options;

  const [{ PDFiumLibrary }, { jsPDF }] = await Promise.all([
    import("@hyzyla/pdfium/browser/base64"),
    import("jspdf"),
  ]);

  const lib = await PDFiumLibrary.init({ disableBase64Warning: true });
  const bytes =
    fileBytes instanceof Uint8Array ? fileBytes : new Uint8Array(fileBytes);
  const doc = await lib.loadDocument(bytes);

  let out: import("jspdf").jsPDF | null = null;

  try {
    const total = doc.getPageCount();

    for (let i = 0; i < total; i += 1) {
      if (signal?.cancelled) throw new Error("cancelled");

      onProgress?.({ phase: "render", page: i + 1, total });
      const page = doc.getPage(i);
      const rendered = await page.render({
        scale: RENDER_SCALE,
        render: "bitmap",
      });

      // Page size in points (1/72") — PDFium's floored original dimensions.
      const wPt = rendered.originalWidth;
      const hPt = rendered.originalHeight;
      const orientation = wPt > hPt ? "landscape" : "portrait";

      if (!out) {
        out = new jsPDF({ unit: "pt", format: [wPt, hPt], orientation });
      } else {
        out.addPage([wPt, hPt], orientation);
      }

      const canvas = bitmapToCanvas(rendered.data, rendered.width, rendered.height);
      out.addImage(
        canvas.toDataURL("image/jpeg", PAGE_JPEG_QUALITY),
        "JPEG",
        0,
        0,
        wPt,
        hPt,
      );

      if (signal?.cancelled) throw new Error("cancelled");
      onProgress?.({ phase: "ocr", page: i + 1, total });
      const words = await ocrCanvas(canvas);

      // Invisible text layer: place each OCR'd word at its box so the page is
      // selectable/searchable while only the image shows.
      out.setTextColor(0, 0, 0);
      for (const w of words) {
        const boxH = (w.y1 - w.y0) * hPt;
        if (boxH <= 0) continue;
        out.setFontSize(Math.max(1, boxH * 0.9));
        out.text(w.t, w.x0 * wPt, w.y1 * hPt, {
          renderingMode: "invisible",
          baseline: "alphabetic",
        });
      }

      canvas.width = 0; // release backing store
      canvas.height = 0;
    }

    if (!out) throw new Error("PDF has no pages");
    return out.output("blob");
  } finally {
    doc.destroy();
    lib.destroy();
    void terminateOcrWorker();
  }
}
