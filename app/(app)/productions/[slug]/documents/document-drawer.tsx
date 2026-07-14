"use client";

import { useEffect, useState, useTransition } from "react";
import {
  X,
  File,
  Pin,
  Download,
  MessageSquare,
  MessageSquareOff,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { getDocumentUrl, getDocumentDownloadUrl } from "@/features/documents/actions";
import { pinItem } from "@/features/pins/actions";
import { Drawer } from "@/components/ui/drawer/drawer";
import { DocumentCommentsPanel } from "./document-comments-panel";
import { FolderSelect } from "./folder-select";
import type { FolderOption } from "./folder-select";
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

// Append PDF viewer params to suppress the page thumbnail sidebar.
// #navpanes=0 works in Chrome; pagemode=none closes the sidebar in Firefox.
function pdfViewerUrl(url: string): string {
  return `${url}#navpanes=0&pagemode=none`;
}

function DownloadButton({
  documentId,
  fileName,
}: {
  documentId: string;
  fileName: string;
}) {
  const [isPending, startTransition] = useTransition();

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
  folders: FolderOption[];
  initialPinned: boolean;
  /** Can this user move documents (documents:upload)? Gates the folder control. */
  canManage: boolean;
  onClose: () => void;
}

export function DocumentDrawer({ doc, members, folders, initialPinned, canManage, onClose }: Props) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loadingUrl, setLoadingUrl] = useState(true);
  const [showComments, setShowComments] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [pinned, setPinned] = useState(initialPinned);
  const [, startPinTransition] = useTransition();

  function handlePinToggle() {
    const next = !pinned;
    setPinned(next);
    startPinTransition(async () => {
      const result = await pinItem("document", doc.id, next);
      setPinned(result.pinned);
    });
  }

  useEffect(() => {
    let canceled = false;
    getDocumentUrl(doc.id).then((url) => {
      if (!canceled) {
        setSignedUrl(url || null);
        setLoadingUrl(false);
      }
    });
    return () => {
      canceled = true;
    };
  }, [doc.id]);

  // Escape and backdrop close route through here so fullscreen exits first
  // (the <Drawer> primitive owns the listener + body-scroll lock).
  function handleDismiss() {
    if (fullscreen) setFullscreen(false);
    else onClose();
  }

  const color = doc.folderName ? folderColor(doc.folderName) : "";
  const isPdf = doc.contentType === "application/pdf";
  const isImage = doc.contentType.startsWith("image/");

  const viewerContent =
    loadingUrl ? (
      <div style={{ margin: "auto", color: "var(--ink-4)", fontSize: 13 }}>
        Loading preview…
      </div>
    ) : isPdf && signedUrl ? (
      <iframe
        src={pdfViewerUrl(signedUrl)}
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
      <div style={{ margin: "auto", textAlign: "center", padding: "48px 32px" }}>
        <File
          size={52}
          strokeWidth={1.1}
          style={{ color: "var(--ink-4)", marginBottom: 14 }}
        />
        <p style={{ fontSize: 15, fontWeight: 500 }}>{doc.fileName}</p>
        <p style={{ fontSize: 13, color: "var(--ink-3)", margin: "6px 0 20px" }}>
          Preview not available for this file type
        </p>
        {signedUrl && (
          <DownloadButton documentId={doc.id} fileName={doc.fileName} />
        )}
      </div>
    );

  return (
    <>
      {/* Fullscreen overlay — sits above the drawer (the shared <Drawer> root
          is z-index 240, so this must clear it). */}
      {fullscreen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 260,
            background: "#1a1a1a",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Slim bar above the viewer — keeps button out of the PDF chrome */}
          <div
            style={{
              flexShrink: 0,
              height: 40,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 16px",
              background: "#111",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <span
              style={{
                fontSize: 13,
                color: "rgba(255,255,255,0.5)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {doc.title}
            </span>
            <button
              onClick={() => setFullscreen(false)}
              title="Exit fullscreen (Esc)"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 10px",
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 6,
                color: "rgba(255,255,255,0.8)",
                fontSize: 13,
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              <Minimize2 size={14} />
              <span>Exit fullscreen</span>
            </button>
          </div>

          {/* Viewer fills remaining space */}
          <div style={{ flex: 1, overflow: "hidden" }}>{viewerContent}</div>
        </div>
      )}

      {/* Drawer panel — the document viewer stays a wide right panel even on
          phones (no bottom-sheet), so mobileSheet is off. */}
      <Drawer
        open
        onClose={handleDismiss}
        width="min(1400px, 92vw)"
        mobileSheet={false}
        ariaLabel={`${doc.title} — document preview`}
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
              <FolderSelect
                documentId={doc.id}
                currentFolderId={doc.folderId}
                folders={folders}
                canEdit={canManage}
              />
              <span>
                {doc.fileName} · {formatFileSize(doc.fileSize)}
              </span>
            </div>
          </div>
          <DownloadButton documentId={doc.id} fileName={doc.fileName} />
          <button
            className="btn ghost btn-icon"
            onClick={handlePinToggle}
            title={pinned ? "Unpin from dashboard" : "Pin to dashboard"}
            style={{ color: pinned ? "var(--c-amber)" : undefined }}
          >
            <Pin size={16} />
          </button>
          {(isPdf || isImage) && (
            <button
              className="btn ghost btn-icon"
              onClick={() => setFullscreen(true)}
              title="Fullscreen"
            >
              <Maximize2 size={16} />
            </button>
          )}
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
            {viewerContent}
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
      </Drawer>
    </>
  );
}
