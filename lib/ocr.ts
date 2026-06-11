import type { OcrWord } from "@/features/scripts/constants";

/**
 * In-browser OCR for scanned scripts, via tesseract.js.
 *
 * The engine (worker + WASM core) is self-hosted from /public/tesseract
 * (scripts/copy-tesseract-assets.mjs). The language data is fetched from
 * `langPath` — by default the tessdata CDN, overridable with
 * NEXT_PUBLIC_TESSERACT_LANG_PATH if it should be self-hosted too.
 *
 * One worker is created lazily and reused for the whole document; the caller
 * (the Script viewer) drives page-by-page progress and terminates the worker
 * when done.
 */
type TesseractWorker = Awaited<
  ReturnType<typeof import("tesseract.js").createWorker>
>;

// Render scale is chosen so the long edge lands near this many pixels — enough
// detail for clean OCR without ballooning memory on a 200-page script.
const OCR_TARGET_LONG_EDGE = 2000;
// Tesseract confidence is 0..100; drop words below this (usually punctuation
// noise or speckle on a scan) so the text layer stays clean.
const MIN_WORD_CONFIDENCE = 40;

let workerPromise: Promise<TesseractWorker> | null = null;

async function getWorker(): Promise<TesseractWorker> {
  if (workerPromise) return workerPromise;
  workerPromise = (async () => {
    const { createWorker } = await import("tesseract.js");
    const langPath =
      process.env.NEXT_PUBLIC_TESSERACT_LANG_PATH ||
      "https://tessdata.projectnaptha.com/4.0.0";
    return createWorker("eng", 1, {
      workerPath: "/tesseract/worker.min.js",
      corePath: "/tesseract",
      langPath,
    });
  })();
  // Drop a failed init so a later attempt can retry instead of replaying it.
  workerPromise.catch(() => {
    workerPromise = null;
  });
  return workerPromise;
}

/** Scale a pdfjs page should render at so OCR sees enough detail. */
export function ocrRenderScale(pageWidthPts: number, pageHeightPts: number): number {
  const longEdge = Math.max(pageWidthPts, pageHeightPts);
  if (longEdge <= 0) return 2;
  return Math.min(4, Math.max(1.5, OCR_TARGET_LONG_EDGE / longEdge));
}

/**
 * OCR a rendered page canvas into normalized word boxes (0..1 of the canvas
 * width/height) so they map to any later render scale in the viewer.
 */
export async function ocrCanvas(
  canvas: HTMLCanvasElement,
): Promise<OcrWord[]> {
  const worker = await getWorker();
  const { data } = await worker.recognize(canvas, {}, { blocks: true });

  const w = canvas.width;
  const h = canvas.height;
  if (!w || !h) return [];

  const words: OcrWord[] = [];
  for (const block of data.blocks ?? []) {
    for (const para of block.paragraphs ?? []) {
      for (const line of para.lines ?? []) {
        for (const word of line.words ?? []) {
          const text = word.text?.trim();
          if (!text) continue;
          if (word.confidence < MIN_WORD_CONFIDENCE) continue;
          const { x0, y0, x1, y1 } = word.bbox;
          words.push({
            t: text,
            x0: x0 / w,
            y0: y0 / h,
            x1: x1 / w,
            y1: y1 / h,
          });
        }
      }
    }
  }
  return words;
}

/** Release the OCR worker once a document has finished processing. */
export async function terminateOcrWorker(): Promise<void> {
  if (!workerPromise) return;
  const p = workerPromise;
  workerPromise = null;
  try {
    const worker = await p;
    await worker.terminate();
  } catch {
    /* best-effort */
  }
}
