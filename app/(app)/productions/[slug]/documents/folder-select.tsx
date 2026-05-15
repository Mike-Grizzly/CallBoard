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
}

export function FolderSelect({
  documentId,
  currentFolderId,
  folders,
  stopPropagation = false,
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
