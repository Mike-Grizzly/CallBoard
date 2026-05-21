"use client";

import { useTransition } from "react";
import { Eye, Download } from "lucide-react";
import { getDocumentUrl, getDocumentDownloadUrl } from "@/features/documents/actions";

export function DocumentViewButton({
  documentId,
  fileName,
}: {
  documentId: string;
  fileName: string;
}) {
  const [isPending, startTransition] = useTransition();

  function handleView() {
    startTransition(async () => {
      const url = await getDocumentUrl(documentId);
      if (url) {
        window.open(url, "_blank");
      }
    });
  }

  function handleDownload() {
    startTransition(async () => {
      const url = await getDocumentDownloadUrl(documentId, fileName);
      if (url) {
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={handleView}
        disabled={isPending}
        className="rounded p-1.5 text-[color:var(--muted-foreground)] transition-colors hover:bg-[color:var(--muted)] hover:text-[color:var(--foreground)]"
        title="View"
      >
        <Eye className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={handleDownload}
        disabled={isPending}
        className="rounded p-1.5 text-[color:var(--muted-foreground)] transition-colors hover:bg-[color:var(--muted)] hover:text-[color:var(--foreground)]"
        title="Download"
      >
        <Download className="h-4 w-4" />
      </button>
    </>
  );
}
