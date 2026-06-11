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

// PDFium render scale. 3.0 on a US-Letter page ≈ 216 dpi — a deliberate step up
// from 144 dpi: measurably cleaner OCR (more words recovered, higher confidence)
// without exploding memory/output size on a long script.
const RENDER_SCALE = 3.0;
// JPEG quality for the page images embedded in the rebuilt PDF.
const PAGE_JPEG_QUALITY = 0.72;
// Assumed scan resolution when sizing the PDF page for a bare image upload
// (images carry no physical page size). 150 dpi ≈ a typical scan.
const IMAGE_ASSUMED_DPI = 150;
// Cap a decoded image's long edge so a huge photo doesn't blow up memory/OCR.
const IMAGE_MAX_LONG_EDGE = 3500;

/** Image MIME types the browser can decode for the image → searchable path. */
export const OCR_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

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

/**
 * Add one page to the output PDF: the rendered canvas as a JPEG, plus an
 * invisible, selectable text layer from OCR'ing that canvas. Creates the
 * document on the first page (sizing it to that page). Returns the document.
 */
async function appendOcrPage(
  out: import("jspdf").jsPDF | null,
  jsPDFCtor: typeof import("jspdf").jsPDF,
  canvas: HTMLCanvasElement,
  wPt: number,
  hPt: number,
): Promise<import("jspdf").jsPDF> {
  const orientation = wPt > hPt ? "landscape" : "portrait";
  const doc = out
    ? (out.addPage([wPt, hPt], orientation), out)
    : new jsPDFCtor({ unit: "pt", format: [wPt, hPt], orientation });

  doc.addImage(
    canvas.toDataURL("image/jpeg", PAGE_JPEG_QUALITY),
    "JPEG",
    0,
    0,
    wPt,
    hPt,
  );

  const words = await ocrCanvas(canvas);
  doc.setTextColor(0, 0, 0);
  for (const w of words) {
    const boxH = (w.y1 - w.y0) * hPt;
    if (boxH <= 0) continue;
    doc.setFontSize(Math.max(1, boxH * 0.9));
    doc.text(w.t, w.x0 * wPt, w.y1 * hPt, {
      renderingMode: "invisible",
      baseline: "alphabetic",
    });
  }
  return doc;
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
      const canvas = bitmapToCanvas(rendered.data, rendered.width, rendered.height);

      if (signal?.cancelled) throw new Error("cancelled");
      onProgress?.({ phase: "ocr", page: i + 1, total });
      out = await appendOcrPage(out, jsPDF, canvas, wPt, hPt);

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

/**
 * Rebuild a single uploaded image (JPEG/PNG/WebP scan) into a one-page
 * searchable PDF — the image as the page, with an invisible OCR text layer.
 */
export async function rebuildImageAsSearchablePdf(
  file: Blob,
  options: RebuildOptions = {},
): Promise<Blob> {
  const { onProgress, signal } = options;
  const { jsPDF } = await import("jspdf");

  onProgress?.({ phase: "render", page: 1, total: 1 });
  // Honour EXIF rotation so a phone photo isn't OCR'd sideways.
  const bitmap = await createImageBitmap(file, {
    imageOrientation: "from-image",
  });
  try {
    // Downscale only if the image is enormous, to bound memory/OCR cost.
    const longEdge = Math.max(bitmap.width, bitmap.height);
    const k = longEdge > IMAGE_MAX_LONG_EDGE ? IMAGE_MAX_LONG_EDGE / longEdge : 1;
    const cw = Math.round(bitmap.width * k);
    const ch = Math.round(bitmap.height * k);

    const canvas = document.createElement("canvas");
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2D canvas unavailable");
    ctx.drawImage(bitmap, 0, 0, cw, ch);

    if (signal?.cancelled) throw new Error("cancelled");
    onProgress?.({ phase: "ocr", page: 1, total: 1 });
    const pt = 72 / IMAGE_ASSUMED_DPI;
    const out = await appendOcrPage(null, jsPDF, canvas, cw * pt, ch * pt);

    canvas.width = 0;
    canvas.height = 0;
    return out.output("blob");
  } finally {
    bitmap.close();
    void terminateOcrWorker();
  }
}
