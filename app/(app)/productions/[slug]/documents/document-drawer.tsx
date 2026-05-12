"use client";

import { useEffect, useState, useTransition } from "react";
import { X, File, Download, MessageSquare, MessageSquareOff } from "lucide-react";
import { getDocumentUrl } from "@/features/documents/actions";
import { DocumentCommentsPanel } from "./document-comments-panel";
import type { DocumentWithUploader } from "@/features/documents/queries";
import type { ProductionMember } from "@/features/members/queries";

const PALETTE = ["clay", "sage", "plum", "amber", "dusk"] as const;
function folderColor(name: string): string {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function DownloadButton({
  storagePath,
  fileName,
}: {
  storagePath: string;
  fileName: string;
}) {
  const [isPending, startTransition] = useTransition();

  function handleDownload() {
    startTransition(async () => {
      const url = await getDocumentUrl(storagePath);
      if (url) {
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        a.click();
      }
    });
  }

  return (
    <button
      className="btn"
      onClick={handleDownload}
      disabled={isPending}
      style={{ gap: 6, flexShrink: 0 }}
    >
      <Download size={14} />
      <span>{isPending ? "…" : "Download"}</span>
    </button>
  );
}

interface Props {
  doc: DocumentWithUploader;
  members: ProductionMember[];
  onClose: () => void;
}

export function DocumentDrawer({ doc, members, onClose }: Props) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loadingUrl, setLoadingUrl] = useState(true);
  const [showComments, setShowComments] = useState(true);

  useEffect(() => {
    let canceled = false;
    getDocumentUrl(doc.storagePath).then((url) => {
      if (!canceled) {
        setSignedUrl(url || null);
        setLoadingUrl(false);
      }
    });
    return () => {
      canceled = true;
    };
  }, [doc.storagePath]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const color = doc.folderName ? folderColor(doc.folderName) : "";
  const isPdf = doc.contentType === "application/pdf";
  const isImage = doc.contentType.startsWith("image/");

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 200,
          background: "rgba(0,0,0,0.4)",
        }}
      />

      {/* Drawer panel */}
      <div
        className="anim-in"
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "min(1400px, 92vw)",
          zIndex: 201,
          background: "var(--bg-elev)",
          boxShadow: "-8px 0 40px rgba(0,0,0,.18)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "14px 18px",
            borderBottom: "1px solid var(--border)",
            flexShrink: 0,
          }}
        >
          <div
            className="notif-ico"
            data-c={color || undefined}
            style={{ width: 36, height: 36, flexShrink: 0 }}
          >
            <File size={16} strokeWidth={1.5} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {doc.title}
            </div>
            <div
              style={{
                fontSize: 12,
                color: "var(--ink-3)",
                marginTop: 3,
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              {doc.folderName && (
                <span className="pill" data-c={color || undefined}>
                  {doc.folderName}
                </span>
              )}
              <span>
                {doc.fileName} · {formatFileSize(doc.fileSize)}
              </span>
            </div>
          </div>
          <DownloadButton storagePath={doc.storagePath} fileName={doc.fileName} />
          <button
            className="btn ghost btn-icon"
            onClick={() => setShowComments((v) => !v)}
            title={showComments ? "Hide comments" : "Show comments"}
            style={{ color: showComments ? "var(--accent)" : undefined }}
          >
            {showComments ? (
              <MessageSquare size={16} />
            ) : (
              <MessageSquareOff size={16} />
            )}
          </button>
          <button
            className="btn ghost btn-icon"
            onClick={onClose}
            title="Close (Esc)"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div
          style={{
            flex: 1,
            display: "grid",
            gridTemplateColumns: showComments ? "1fr 320px" : "1fr",
            overflow: "hidden",
            minHeight: 0,
          }}
        >
          {/* Document viewer */}
          <div
            style={{
              overflow: "hidden",
              background: "var(--bg-sunken)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {loadingUrl ? (
              <div
                style={{
                  margin: "auto",
                  color: "var(--ink-4)",
                  fontSize: 13,
                }}
              >
                Loading preview…
              </div>
            ) : isPdf && signedUrl ? (
              <iframe
                src={signedUrl}
                style={{ width: "100%", height: "100%", border: "none" }}
                title={doc.title}
              />
            ) : isImage && signedUrl ? (
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 20,
                }}
              >
                <img
                  src={signedUrl}
                  alt={doc.title}
                  style={{
                    maxWidth: "100%",
                    maxHeight: "100%",
                    objectFit: "contain",
                    borderRadius: 4,
                  }}
                />
              </div>
            ) : (
              <div
                style={{
                  margin: "auto",
                  textAlign: "center",
                  padding: "48px 32px",
                }}
              >
                <File
                  size={52}
                  strokeWidth={1.1}
                  style={{ color: "var(--ink-4)", marginBottom: 14 }}
                />
                <p style={{ fontSize: 15, fontWeight: 500 }}>{doc.fileName}</p>
                <p
                  style={{
                    fontSize: 13,
                    color: "var(--ink-3)",
                    margin: "6px 0 20px",
                  }}
                >
                  Preview not available for this file type
                </p>
                {signedUrl && (
                  <DownloadButton
                    storagePath={doc.storagePath}
                    fileName={doc.fileName}
                  />
                )}
              </div>
            )}
          </div>

          {/* Comments */}
          {showComments && (
            <div
              style={{
                borderLeft: "1px solid var(--border)",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              <DocumentCommentsPanel documentId={doc.id} members={members} />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
