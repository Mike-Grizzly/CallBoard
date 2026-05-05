"use client";

import { useState, useTransition } from "react";
import { Download } from "lucide-react";
import { getDocumentUrl } from "@/features/documents/actions";

export function DocumentDownloadButton({
  storagePath,
  fileName,
}: {
  storagePath: string;
  fileName: string;
}) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const url = await getDocumentUrl(storagePath);
      if (url) {
        window.open(url, "_blank");
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="rounded p-1.5 text-[color:var(--muted-foreground)] transition-colors hover:bg-[color:var(--accent)] hover:text-[color:var(--foreground)]"
      title={`Download ${fileName}`}
    >
      <Download className="h-4 w-4" />
    </button>
  );
}
