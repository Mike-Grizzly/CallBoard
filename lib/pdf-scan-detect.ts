import { loadPdfDocument } from "./pdf";
import { OCR_IMAGE_TYPES } from "./pdf-ocr-rebuild";

/**
 * Is this PDF an image-only scan (no real text layer)? Samples the first few
 * pages' extractable text — the same heuristic the Script viewer and AI parser
 * use, and what Adobe keys "Recognize Text" off of. Used at upload time to
 * offer a searchable-PDF rebuild.
 *
 * Conservative: any error (not a PDF, parse failure) returns false so we never
 * block or nag on a normal upload.
 */
export async function isScannedPdf(file: File): Promise<boolean> {
  if (file.type !== "application/pdf") return false;
  const url = URL.createObjectURL(file);
  try {
    const pdf = await loadPdfDocument(url);
    const sample = Math.min(pdf.numPages, 5);
    let chars = 0;
    for (let n = 1; n <= sample && chars <= 200; n += 1) {
      const page = await pdf.getPage(n);
      const tc = await page.getTextContent();
      for (const item of tc.items) {
        if ("str" in item) chars += item.str.length;
      }
    }
    return chars < 100;
  } catch {
    return false;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Should we offer to make this uploaded script searchable? True for a
 * supported image (always image-only) or a PDF with no real text layer.
 */
export async function needsScriptOcr(file: File): Promise<boolean> {
  if (OCR_IMAGE_TYPES.includes(file.type)) return true;
  return isScannedPdf(file);
}
