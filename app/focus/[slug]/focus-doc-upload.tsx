"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  requestDocumentUpload,
  finalizeDocumentUpload,
} from "@/features/documents/actions";
import { uploadFileToSignedUrl } from "@/lib/storage-upload";
import { FileDropzone } from "@/components/ui/file-dropzone";

/**
 * Minimal PDF uploader for Focus empty-states (e.g. adding a ground plan in the
 * stage-setup view). Uploads a PDF as a production document, then refreshes so
 * the server-rendered picker (the setup wizard) sees it.
 */
export function FocusDocUpload({
  productionId,
  documentType = "general",
  label = "Upload a PDF",
}: {
  productionId: string;
  documentType?: string;
  label?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onFile(file: File | null) {
    setError(null);
    if (!file) return;
    if (file.type !== "application/pdf") {
      setError("Please choose a PDF file.");
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
      const up = await uploadFileToSignedUrl(signed.path, signed.token, file);
      if (up.error) {
        setError(up.error);
        return;
      }
      const title = file.name.replace(/\.pdf$/i, "").trim() || "Document";
      const fin = await finalizeDocumentUpload({
        productionId,
        storagePath: signed.path,
        title,
        folderId: null,
        documentType,
        fileName: file.name,
        fileSize: file.size,
        contentType: file.type,
      });
      if (fin.error) {
        setError(fin.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="fx-docupload">
      <FileDropzone
        accept="application/pdf"
        onFile={onFile}
        disabled={pending}
        hint={pending ? "Uploading…" : `${label} — or drop a PDF here`}
      />
      {error && <span className="fx-docupload-err">{error}</span>}
    </div>
  );
}
