"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  FileText,
  CalendarDays,
  Paintbrush,
  Music,
  BookOpen,
  File,
  Upload as UploadIcon,
  List as ListIcon,
  Grid2X2,
  Download,
  ExternalLink,
  X,
  Folder,
} from "lucide-react";
import { getDocumentUrl } from "@/features/documents/actions";
import { DocumentUploadForm } from "./document-upload-form";
import { DocumentDeleteButton } from "./document-delete-button";
import type { DocumentWithUploader } from "@/features/documents/queries";

const TYPE_META: Record<string, { color: string; label: string }> = {
  script:    { color: "clay",  label: "Script" },
  schedule:  { color: "sage",  label: "Schedule" },
  design:    { color: "plum",  label: "Design / Tech" },
  music:     { color: "amber", label: "Music / Score" },
  reference: { color: "dusk",  label: "Reference" },
  general:   { color: "",      label: "General" },
};

function DocIcon({ type, size = 14 }: { type: string; size?: number }) {
  switch (type) {
    case "script":    return <FileText size={size} strokeWidth={1.5} />;
    case "schedule":  return <CalendarDays size={size} strokeWidth={1.5} />;
    case "design":    return <Paintbrush size={size} strokeWidth={1.5} />;
    case "music":     return <Music size={size} strokeWidth={1.5} />;
    case "reference": return <BookOpen size={size} strokeWidth={1.5} />;
    default:          return <File size={size} strokeWidth={1.5} />;
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatStorageSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
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
      style={{ gap: 6 }}
    >
      <Download size={14} />
      <span>{isPending ? "…" : "Download"}</span>
    </button>
  );
}

interface Props {
  documents: DocumentWithUploader[];
  productionId: string;
  productionTitle: string;
  slug: string;
  canUpload: boolean;
}

export function DocumentsClient({
  documents,
  productionId,
  productionTitle,
  slug,
  canUpload,
}: Props) {
  const [activeFolder, setActiveFolder] = useState("All files");
  const [view, setView] = useState<"list" | "grid">("list");
  const [sel, setSel] = useState<DocumentWithUploader | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  // Build folder list — only show types that have at least one document
  const typeFolders = Object.entries(TYPE_META)
    .map(([type, meta]) => ({
      name: meta.label,
      count: documents.filter((d) => d.documentType === type).length,
      type,
    }))
    .filter((f) => f.count > 0);

  const folders = [{ name: "All files", count: documents.length }, ...typeFolders];

  const visible =
    activeFolder === "All files"
      ? documents
      : documents.filter(
          (d) => TYPE_META[d.documentType]?.label === activeFolder,
        );

  // Storage stats
  const totalBytes = documents.reduce((sum, d) => sum + d.fileSize, 0);
  const limitGb = 10;
  const pct = Math.min(100, (totalBytes / (limitGb * 1024 ** 3)) * 100);

  return (
    <div
      className="anim-in"
      style={{
        display: "grid",
        gridTemplateColumns: "220px 1fr",
        gap: 20,
        maxWidth: 1280,
        margin: "0 auto",
      }}
    >
      {/* ── Folder rail ── */}
      <div>
        <div className="h-eyebrow" style={{ marginBottom: 10 }}>
          Folders
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {folders.map((f) => {
            const active = activeFolder === f.name;
            return (
              <button
                key={f.name}
                onClick={() => {
                  setActiveFolder(f.name);
                  setSel(null);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "7px 10px",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontSize: 13,
                  border: "none",
                  textAlign: "left",
                  width: "100%",
                  background: active ? "var(--bg-elev)" : "transparent",
                  boxShadow: active ? "var(--shadow-1)" : "none",
                  color: active ? "var(--ink)" : "var(--ink-3)",
                  fontWeight: active ? 500 : 400,
                }}
                onMouseEnter={(e) => {
                  if (!active)
                    (e.currentTarget as HTMLElement).style.background =
                      "var(--bg-muted)";
                }}
                onMouseLeave={(e) => {
                  if (!active)
                    (e.currentTarget as HTMLElement).style.background =
                      "transparent";
                }}
              >
                <Folder size={14} />
                <span style={{ flex: 1 }}>{f.name}</span>
                <span style={{ fontSize: 11.5, color: "var(--ink-4)" }}>
                  {f.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="h-eyebrow" style={{ marginTop: 24, marginBottom: 10 }}>
          Storage
        </div>
        <div
          style={{
            padding: "12px 14px",
            background: "var(--bg-sunken)",
            borderRadius: "var(--radius-s)",
          }}
        >
          <div
            className="row-between"
            style={{ fontSize: 12, marginBottom: 6 }}
          >
            <span style={{ fontWeight: 500 }}>
              {formatStorageSize(totalBytes)}
            </span>
            <span style={{ color: "var(--ink-3)" }}>of {limitGb} GB</span>
          </div>
          <div
            style={{
              height: 4,
              background: "var(--bg)",
              borderRadius: 999,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${pct}%`,
                background: "var(--accent)",
                minWidth: pct > 0 ? 4 : 0,
              }}
            />
          </div>
        </div>
      </div>

      {/* ── Main area ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
        {/* Header row */}
        <div className="row-between">
          <div>
            <h2 className="h-section">{activeFolder}</h2>
            <div style={{ fontSize: 12.5, color: "var(--ink-3)", marginTop: 2 }}>
              {visible.length} {visible.length === 1 ? "file" : "files"} ·
              shared with {productionTitle} team
            </div>
          </div>
          <div className="row" style={{ gap: 8 }}>
            {/* List / grid toggle */}
            <div
              style={{
                display: "flex",
                border: "1px solid var(--border)",
                borderRadius: 6,
                overflow: "hidden",
              }}
            >
              <button
                onClick={() => setView("list")}
                className="btn ghost btn-icon"
                style={{
                  borderRadius: 0,
                  height: 30,
                  width: 32,
                  background:
                    view === "list" ? "var(--bg-sunken)" : "transparent",
                }}
                title="List view"
              >
                <ListIcon size={14} />
              </button>
              <button
                onClick={() => setView("grid")}
                className="btn ghost btn-icon"
                style={{
                  borderRadius: 0,
                  height: 30,
                  width: 32,
                  background:
                    view === "grid" ? "var(--bg-sunken)" : "transparent",
                }}
                title="Grid view"
              >
                <Grid2X2 size={14} />
              </button>
            </div>
            {canUpload && (
              <button
                className={showUpload ? "btn primary" : "btn"}
                onClick={() => setShowUpload((s) => !s)}
                style={{ gap: 6 }}
              >
                <UploadIcon size={14} />
                <span>Upload</span>
              </button>
            )}
          </div>
        </div>

        {/* Upload form */}
        {canUpload && showUpload && (
          <div className="card card-pad anim-in">
            <DocumentUploadForm productionId={productionId} />
          </div>
        )}

        {/* Empty state */}
        {visible.length === 0 ? (
          <div
            className="card"
            style={{ textAlign: "center", padding: "56px 20px" }}
          >
            <File
              size={40}
              strokeWidth={1.2}
              style={{ margin: "0 auto 12px", color: "var(--ink-4)" }}
            />
            <p style={{ fontSize: 14, fontWeight: 500 }}>No documents yet</p>
            <p style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 4 }}>
              {canUpload
                ? "Upload scripts, schedules, and other production files."
                : "No documents have been uploaded yet."}
            </p>
          </div>
        ) : view === "list" ? (
          /* ── List view ── */
          <div className="card" style={{ overflow: "hidden" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: canUpload
                  ? "40px 1fr 150px 130px 130px 40px"
                  : "40px 1fr 150px 130px 130px",
                padding: "10px 16px",
                borderBottom: "1px solid var(--border)",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: ".06em",
                textTransform: "uppercase",
                color: "var(--ink-4)",
              }}
            >
              <span />
              <span>Name</span>
              <span>Type</span>
              <span>Uploaded by</span>
              <span>Date</span>
              {canUpload && <span />}
            </div>
            {visible.map((doc) => {
              const meta = TYPE_META[doc.documentType] ?? TYPE_META.general;
              const uploaderName =
                doc.uploadedByFirstName || doc.uploadedByLastName
                  ? `${doc.uploadedByFirstName ?? ""} ${doc.uploadedByLastName ?? ""}`.trim()
                  : doc.uploadedByEmail;
              const isSelected = sel?.id === doc.id;

              return (
                <div
                  key={doc.id}
                  onClick={() => setSel(isSelected ? null : doc)}
                  style={{
                    display: "grid",
                    gridTemplateColumns: canUpload
                      ? "40px 1fr 150px 130px 130px 40px"
                      : "40px 1fr 150px 130px 130px",
                    padding: "12px 16px",
                    borderBottom: "1px solid var(--border)",
                    alignItems: "center",
                    fontSize: 13,
                    cursor: "pointer",
                    background: isSelected
                      ? "color-mix(in oklch, var(--accent-soft) 30%, transparent)"
                      : "transparent",
                    transition: "background .1s",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected)
                      (e.currentTarget as HTMLElement).style.background =
                        "var(--bg-muted)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected)
                      (e.currentTarget as HTMLElement).style.background =
                        "transparent";
                  }}
                >
                  <div
                    className="notif-ico"
                    data-c={meta.color || undefined}
                    style={{ width: 28, height: 28 }}
                  >
                    <DocIcon type={doc.documentType} size={14} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <Link
                      href={`/productions/${slug}/documents/${doc.id}`}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        fontWeight: 500,
                        color: "var(--ink)",
                        textDecoration: "none",
                        display: "block",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      className="hover:underline"
                    >
                      {doc.title}
                    </Link>
                    <div
                      style={{
                        fontSize: 11.5,
                        color: "var(--ink-3)",
                        marginTop: 1,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {doc.fileName} · {formatFileSize(doc.fileSize)}
                    </div>
                  </div>
                  <span
                    className="pill"
                    data-c={meta.color || undefined}
                    style={{ justifySelf: "start" }}
                  >
                    {meta.label}
                  </span>
                  <span
                    style={{
                      color: "var(--ink-3)",
                      fontSize: 12.5,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {uploaderName}
                  </span>
                  <span style={{ color: "var(--ink-3)", fontSize: 12.5 }}>
                    {formatDate(doc.createdAt)}
                  </span>
                  {canUpload && (
                    <div onClick={(e) => e.stopPropagation()}>
                      <DocumentDeleteButton documentId={doc.id} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* ── Grid view ── */
          <div className="grid grid-4" style={{ gap: 14 }}>
            {visible.map((doc) => {
              const meta = TYPE_META[doc.documentType] ?? TYPE_META.general;
              const isSelected = sel?.id === doc.id;

              return (
                <div
                  key={doc.id}
                  onClick={() => setSel(isSelected ? null : doc)}
                  className="card"
                  style={{
                    padding: 0,
                    overflow: "hidden",
                    cursor: "pointer",
                    outline: isSelected ? "2px solid var(--accent)" : "none",
                    outlineOffset: 2,
                  }}
                >
                  <Link
                    href={`/productions/${slug}/documents/${doc.id}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div
                      style={{
                        height: 100,
                        background: meta.color
                          ? `var(--c-${meta.color}-soft)`
                          : "var(--bg-sunken)",
                        display: "grid",
                        placeItems: "center",
                        color: meta.color
                          ? `color-mix(in oklch, var(--c-${meta.color}) 55%, var(--ink))`
                          : "var(--ink-3)",
                      }}
                    >
                      <DocIcon type={doc.documentType} size={36} />
                    </div>
                  </Link>
                  <div style={{ padding: "10px 12px" }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {doc.title}
                    </div>
                    <div
                      className="row-between"
                      style={{ marginTop: 4 }}
                    >
                      <span style={{ fontSize: 11, color: "var(--ink-3)" }}>
                        {formatFileSize(doc.fileSize)}
                      </span>
                      <span style={{ fontSize: 11, color: "var(--ink-3)" }}>
                        {formatDate(doc.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Selected file detail bar ── */}
        {sel && (
          <div
            className="card card-pad anim-in"
            style={{ position: "sticky", bottom: 16 }}
          >
            <div className="row-between">
              <div className="row" style={{ gap: 14 }}>
                <div
                  className="notif-ico"
                  data-c={TYPE_META[sel.documentType]?.color || undefined}
                  style={{ width: 40, height: 40, borderRadius: 10 }}
                >
                  <DocIcon type={sel.documentType} size={18} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>
                    {sel.title}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--ink-3)",
                      marginTop: 2,
                    }}
                  >
                    {TYPE_META[sel.documentType]?.label} ·{" "}
                    {formatFileSize(sel.fileSize)} · {sel.fileName}
                  </div>
                </div>
              </div>
              <div className="row" style={{ gap: 6 }}>
                <DownloadButton
                  storagePath={sel.storagePath}
                  fileName={sel.fileName}
                />
                <Link
                  href={`/productions/${slug}/documents/${sel.id}`}
                  className="btn"
                  style={{ gap: 6 }}
                >
                  <ExternalLink size={14} />
                  <span>Open</span>
                </Link>
                {canUpload && (
                  <DocumentDeleteButton documentId={sel.id} />
                )}
                <button
                  className="btn ghost btn-icon"
                  onClick={() => setSel(null)}
                  style={{ marginLeft: 4 }}
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
