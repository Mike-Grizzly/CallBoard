"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import {
  File,
  Upload as UploadIcon,
  List as ListIcon,
  Grid2X2,
  FolderPlus,
  Check,
  X,
  Folder,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { createFolder } from "@/features/documents/actions";
import { DocumentUploadForm } from "./document-upload-form";
import { DocumentDeleteButton } from "./document-delete-button";
import { DocumentDrawer } from "./document-drawer";
import { FolderSelect } from "./folder-select";
import type {
  DocumentWithUploader,
  DocumentFolder,
} from "@/features/documents/queries";
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

interface Props {
  documents: DocumentWithUploader[];
  folders: DocumentFolder[];
  members: ProductionMember[];
  productionId: string;
  productionTitle: string;
  slug: string;
  canUpload: boolean;
  initialDocId?: string;
}

const ALL_FILES = "All files";
const UNFILED = "__unfiled__";

export function DocumentsClient({
  documents,
  folders,
  members,
  productionId,
  productionTitle,
  slug,
  canUpload,
  initialDocId,
}: Props) {
  const router = useRouter();
  const [activeFolder, setActiveFolder] = useState(ALL_FILES);
  const [view, setView] = useState<"list" | "grid">("list");
  const [openDoc, setOpenDoc] = useState<DocumentWithUploader | null>(() =>
    initialDocId ? (documents.find((d) => d.id === initialDocId) ?? null) : null,
  );
  const [showUpload, setShowUpload] = useState(false);
  const [addingFolder, setAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [folderError, setFolderError] = useState<string | null>(null);
  const [isSavingFolder, startFolderTransition] = useTransition();
  const folderInputRef = useRef<HTMLInputElement>(null);

  function handleAddFolderClick() {
    setAddingFolder(true);
    setNewFolderName("");
    setFolderError(null);
    setTimeout(() => folderInputRef.current?.focus(), 0);
  }

  function handleFolderKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setAddingFolder(false);
      setNewFolderName("");
    } else if (e.key === "Enter") {
      submitNewFolder();
    }
  }

  function submitNewFolder() {
    const name = newFolderName.trim();
    if (!name) return;
    setFolderError(null);
    const formData = new FormData();
    formData.set("production_id", productionId);
    formData.set("name", name);
    startFolderTransition(async () => {
      const result = await createFolder(formData);
      if (result.error) {
        setFolderError(result.error);
      } else {
        setAddingFolder(false);
        setNewFolderName("");
        router.refresh();
      }
    });
  }

  const visible =
    activeFolder === ALL_FILES
      ? documents
      : activeFolder === UNFILED
        ? documents.filter((d) => !d.folderId)
        : documents.filter((d) => {
            const f = folders.find((f) => f.name === activeFolder);
            return f && d.folderId === f.id;
          });

  const unfiledCount = documents.filter((d) => !d.folderId).length;
  const totalBytes = documents.reduce((sum, d) => sum + d.fileSize, 0);
  const limitGb = 10;
  const pct = Math.min(100, (totalBytes / (limitGb * 1024 ** 3)) * 100);

  return (
    <>
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
            <FolderRailItem
              name={ALL_FILES}
              count={documents.length}
              active={activeFolder === ALL_FILES}
              onClick={() => setActiveFolder(ALL_FILES)}
            />
            {folders.map((f) => {
              const count = documents.filter((d) => d.folderId === f.id).length;
              return (
                <FolderRailItem
                  key={f.id}
                  name={f.name}
                  count={count}
                  active={activeFolder === f.name}
                  onClick={() => setActiveFolder(f.name)}
                />
              );
            })}
            {unfiledCount > 0 && (
              <FolderRailItem
                name="Unfiled"
                count={unfiledCount}
                active={activeFolder === UNFILED}
                onClick={() => setActiveFolder(UNFILED)}
              />
            )}
          </div>

          {canUpload && (
            <div style={{ marginTop: 6 }}>
              {addingFolder ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "4px 4px 4px 10px",
                  }}
                >
                  <FolderPlus
                    size={13}
                    style={{ color: "var(--ink-4)", flexShrink: 0 }}
                  />
                  <input
                    ref={folderInputRef}
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onKeyDown={handleFolderKeyDown}
                    placeholder="Folder name"
                    maxLength={50}
                    style={{
                      flex: 1,
                      fontSize: 13,
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-s)",
                      padding: "3px 6px",
                      background: "var(--bg-elev)",
                      color: "var(--ink)",
                      outline: "none",
                      minWidth: 0,
                    }}
                  />
                  <button
                    className="btn-icon"
                    onClick={submitNewFolder}
                    disabled={isSavingFolder || !newFolderName.trim()}
                    title="Create folder"
                    style={{
                      width: 24,
                      height: 24,
                      border: "none",
                      background: "none",
                      cursor: "pointer",
                      color: "var(--accent)",
                      flexShrink: 0,
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    <Check size={13} />
                  </button>
                  <button
                    className="btn-icon"
                    onClick={() => {
                      setAddingFolder(false);
                      setNewFolderName("");
                    }}
                    title="Cancel"
                    style={{
                      width: 24,
                      height: 24,
                      border: "none",
                      background: "none",
                      cursor: "pointer",
                      color: "var(--ink-4)",
                      flexShrink: 0,
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    <X size={13} />
                  </button>
                </div>
              ) : (
                <button
                  className="btn ghost"
                  onClick={handleAddFolderClick}
                  style={{
                    marginTop: 10,
                    height: 28,
                    padding: "0 10px",
                    fontSize: 12,
                    width: "100%",
                    justifyContent: "flex-start",
                    gap: 6,
                  }}
                >
                  <FolderPlus size={13} />
                  <span>New folder</span>
                </button>
              )}
              {folderError && (
                <p
                  style={{
                    fontSize: 11.5,
                    color: "var(--c-clay)",
                    padding: "2px 10px",
                  }}
                >
                  {folderError}
                </p>
              )}
            </div>
          )}

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
        <div
          style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}
        >
          {/* Header */}
          <div className="row-between">
            <div>
              <h2 className="h-section">
                {activeFolder === UNFILED ? "Unfiled" : activeFolder}
              </h2>
              <div
                style={{ fontSize: 12.5, color: "var(--ink-3)", marginTop: 2 }}
              >
                {visible.length} {visible.length === 1 ? "file" : "files"} ·
                shared with {productionTitle} team
              </div>
            </div>
            <div className="row" style={{ gap: 8 }}>
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
              <DocumentUploadForm productionId={productionId} folders={folders} />
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
                <span>Folder</span>
                <span>Uploaded by</span>
                <span>Date</span>
                {canUpload && <span />}
              </div>
              {visible.map((doc) => {
                const color = doc.folderName
                  ? folderColor(doc.folderName)
                  : "";
                const uploaderName =
                  doc.uploadedByFirstName || doc.uploadedByLastName
                    ? `${doc.uploadedByFirstName ?? ""} ${doc.uploadedByLastName ?? ""}`.trim()
                    : doc.uploadedByEmail;

                return (
                  <div
                    key={doc.id}
                    onClick={() => setOpenDoc(doc)}
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
                      transition: "background .1s",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.background =
                        "var(--bg-muted)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.background =
                        "transparent";
                    }}
                  >
                    <div
                      className="notif-ico"
                      data-c={color || undefined}
                      style={{ width: 28, height: 28 }}
                    >
                      <File size={14} strokeWidth={1.5} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 500,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {doc.title}
                      </div>
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
                    <div onClick={(e) => e.stopPropagation()}>
                      <FolderSelect
                        documentId={doc.id}
                        currentFolderId={doc.folderId}
                        folders={folders}
                        stopPropagation
                      />
                    </div>
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
                const color = doc.folderName
                  ? folderColor(doc.folderName)
                  : "";

                return (
                  <div
                    key={doc.id}
                    onClick={() => setOpenDoc(doc)}
                    className="card"
                    style={{
                      padding: 0,
                      overflow: "hidden",
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        height: 100,
                        background: color
                          ? `var(--c-${color}-soft)`
                          : "var(--bg-sunken)",
                        display: "grid",
                        placeItems: "center",
                        color: color
                          ? `color-mix(in oklch, var(--c-${color}) 55%, var(--ink))`
                          : "var(--ink-4)",
                      }}
                    >
                      <File size={36} strokeWidth={1.2} />
                    </div>
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
                          {doc.folderName ?? "Unfiled"}
                        </span>
                        <span style={{ fontSize: 11, color: "var(--ink-3)" }}>
                          {formatFileSize(doc.fileSize)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Document drawer ── */}
      {openDoc && (
        <DocumentDrawer
          doc={openDoc}
          members={members}
          folders={folders}
          onClose={() => setOpenDoc(null)}
        />
      )}
    </>
  );
}

function FolderRailItem({
  name,
  count,
  active,
  onClick,
}: {
  name: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
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
          (e.currentTarget as HTMLButtonElement).style.background =
            "var(--bg-muted)";
      }}
      onMouseLeave={(e) => {
        if (!active)
          (e.currentTarget as HTMLButtonElement).style.background =
            "transparent";
      }}
    >
      <Folder size={14} />
      <span style={{ flex: 1 }}>{name}</span>
      <span style={{ fontSize: 11.5, color: "var(--ink-4)" }}>{count}</span>
    </button>
  );
}
