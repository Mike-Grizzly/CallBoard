"use client";

import { Download, File } from "lucide-react";

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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          minHeight: 600,
          background: "var(--bg-sunken)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={fileName}
          style={{ maxHeight: 600, maxWidth: "100%", borderRadius: 6, objectFit: "contain" }}
        />
      </div>
    );
  }

  if (contentType.startsWith("text/") || contentType === "application/json") {
    return (
      <iframe
        src={url}
        className="h-full min-h-[600px] w-full"
        style={{ background: "white" }}
        title={fileName}
      />
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        padding: 48,
        minHeight: 600,
        textAlign: "center",
      }}
    >
      <File
        size={48}
        strokeWidth={1.2}
        style={{ color: "var(--ink-4)" }}
      />
      <div>
        <p style={{ fontSize: 14, fontWeight: 500 }}>
          Preview not available for this file type
        </p>
        <p style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 4 }}>
          {fileName}
        </p>
      </div>
      <a href={url} download={fileName}>
        <button className="btn" style={{ gap: 6 }}>
          <Download size={14} />
          <span>Download to view</span>
        </button>
      </a>
    </div>
  );
}
