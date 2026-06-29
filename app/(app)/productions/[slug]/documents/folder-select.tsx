"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { moveDocument } from "@/features/documents/actions";

export interface FolderOption {
  id: string;
  name: string;
}

interface Props {
  documentId: string;
  currentFolderId: string | null | undefined;
  folders: FolderOption[];
  /** Stop click events from bubbling (e.g. when inside a clickable row) */
  stopPropagation?: boolean;
  /**
   * When false, render a static label instead of an editable dropdown.
   * Moving documents is gated server-side on `documents:upload`; without this
   * a non-editor would see a working-looking control whose changes silently
   * fail to persist.
   */
  canEdit?: boolean;
}

export function FolderSelect({
  documentId,
  currentFolderId,
  folders,
  stopPropagation = false,
  canEdit = true,
}: Props) {
  const [folderId, setFolderId] = useState(currentFolderId ?? "");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value;
    setFolderId(next);
    const formData = new FormData();
    formData.set("document_id", documentId);
    if (next) formData.set("folder_id", next);
    startTransition(async () => {
      await moveDocument(formData);
      router.refresh();
    });
  }

  // Non-editors see the folder as read-only text, not an interactive control
  // they can't actually use.
  if (!canEdit) {
    const current = folders.find((f) => f.id === (currentFolderId ?? ""));
    return (
      <span style={{ fontSize: 12, color: "var(--ink-3)" }}>
        {current ? current.name : "No folder"}
      </span>
    );
  }

  return (
    <select
      value={folderId}
      onChange={handleChange}
      disabled={isPending}
      onClick={stopPropagation ? (e) => e.stopPropagation() : undefined}
      style={{
        fontSize: 12,
        padding: "2px 8px",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-s)",
        background: "var(--bg-elev)",
        color: "var(--ink-2)",
        cursor: isPending ? "wait" : "pointer",
        opacity: isPending ? 0.6 : 1,
        maxWidth: "100%",
        height: 24,
      }}
    >
      <option value="">— No folder —</option>
      {folders.map((f) => (
        <option key={f.id} value={f.id}>
          {f.name}
        </option>
      ))}
    </select>
  );
}
