import {
  rebuildScanAsSearchablePdf,
  type RebuildProgress,
} from "./pdf-ocr-rebuild";
import {
  createRebuiltScriptUploadUrl,
  finalizeRebuiltScript,
} from "@/features/scripts/ocr-actions";
import { uploadFileToSignedUrl } from "./storage-upload";

export type { RebuildProgress };

/**
 * Rebuild a scanned PDF into a searchable one (PDFium + OCR, in the browser),
 * upload it straight to storage, and install it as the production's default
 * script. Shared by the upload-time prompt and the in-viewer "Make searchable"
 * offer.
 */
export async function installSearchableScript(opts: {
  productionId: string;
  bytes: ArrayBuffer | Uint8Array;
  baseName: string;
  title: string;
  onProgress?: (p: RebuildProgress) => void;
  signal?: { cancelled: boolean };
}): Promise<{ error?: string; cancelled?: boolean }> {
  const { productionId, bytes, baseName, title, onProgress, signal } = opts;

  const blob = await rebuildScanAsSearchablePdf(bytes, { onProgress, signal });
  if (signal?.cancelled) return { cancelled: true };

  const outName = `${baseName.replace(/\.pdf$/i, "")}-searchable.pdf`;
  const signed = await createRebuiltScriptUploadUrl({
    productionId,
    fileName: outName,
  });
  if (signed.error || !signed.path || !signed.token) {
    return { error: signed.error || "Upload could not start." };
  }

  const file = new File([blob], outName, { type: "application/pdf" });
  const up = await uploadFileToSignedUrl(signed.path, signed.token, file);
  if (up.error) return { error: up.error };

  const fin = await finalizeRebuiltScript({
    productionId,
    storagePath: signed.path,
    title: title ? `${title} (searchable)` : "Script (searchable)",
    fileName: outName,
    fileSize: blob.size,
  });
  if (fin.error) return { error: fin.error };

  return {};
}
