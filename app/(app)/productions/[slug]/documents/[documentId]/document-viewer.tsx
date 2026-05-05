"use client";

import { FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DocumentViewer({
  url,
  contentType,
  fileName,
}: {
  url: string;
  contentType: string;
  fileName: string;
}) {
  if (contentType === "application/pdf") {
    return (
      <iframe
        src={url}
        className="h-full min-h-[600px] w-full"
        title={fileName}
      />
    );
  }

  if (contentType.startsWith("image/")) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <img
          src={url}
          alt={fileName}
          className="max-h-[600px] max-w-full rounded object-contain"
        />
      </div>
    );
  }

  if (
    contentType.startsWith("text/") ||
    contentType === "application/json"
  ) {
    return (
      <iframe
        src={url}
        className="h-full min-h-[600px] w-full bg-white"
        title={fileName}
      />
    );
  }

  return (
    <div className="flex h-full min-h-[600px] flex-col items-center justify-center gap-4 p-8 text-center">
      <FileText className="h-16 w-16 text-[color:var(--muted-foreground)]" />
      <div>
        <p className="text-sm font-medium">
          Preview not available for this file type
        </p>
        <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
          {fileName}
        </p>
      </div>
      <a href={url} download={fileName}>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4" aria-hidden />
          Download to view
        </Button>
      </a>
    </div>
  );
}
