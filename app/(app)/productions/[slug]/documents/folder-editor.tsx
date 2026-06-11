"use client";

import { useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { Lock, Users, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { createFolder, updateFolder } from "@/features/documents/actions";
import {
  RESTRICTABLE_ROLES,
  ROLE_LABELS,
} from "@/features/documents/constants";
import type { DocumentFolder } from "@/features/documents/queries";

/**
 * Create / edit a document folder, including role-restricted visibility. A
 * folder is either visible to everyone on the production or limited to the
 * chosen roles (managers always see every folder regardless).
 */
export function FolderEditor({
  productionId,
  folder,
  onClose,
}: {
  /** Required in create mode. */
  productionId?: string;
  /** Provided in edit mode. */
  folder?: DocumentFolder;
  onClose: () => void;
}) {
  const router = useRouter();
  const isEdit = !!folder;
  const [name, setName] = useState(folder?.name ?? "");
  const [restricted, setRestricted] = useState(
    folder?.visibility === "restricted",
  );
  const [roles, setRoles] = useState<Set<string>>(
    () => new Set(folder?.allowedRoles ?? []),
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !pending) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, pending]);

  function toggleRole(role: string) {
    setRoles((prev) => {
      const next = new Set(prev);
      if (next.has(role)) next.delete(role);
      else next.add(role);
      return next;
    });
  }

  function save() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Folder name is required.");
      return;
    }
    if (restricted && roles.size === 0) {
      setError("Pick at least one role, or make the folder visible to everyone.");
      return;
    }
    setError(null);

    const fd = new FormData();
    fd.set("name", trimmed);
    fd.set("visibility", restricted ? "restricted" : "everyone");
    if (restricted) roles.forEach((r) => fd.append("allowed_roles", r));

    startTransition(async () => {
      let result;
      if (isEdit) {
        fd.set("folder_id", folder.id);
        result = await updateFolder(fd);
      } else {
        fd.set("production_id", productionId!);
        result = await createFolder(fd);
      }
      if (result.error) {
        setError(result.error);
      } else {
        onClose();
        router.refresh();
      }
    });
  }

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="confirm-backdrop"
      role="presentation"
      onClick={() => {
        if (!pending) onClose();
      }}
    >
      <div
        className="card card-pad"
        role="dialog"
        aria-modal="true"
        aria-label={isEdit ? "Edit folder" : "New folder"}
        onClick={(e) => e.stopPropagation()}
        style={{ width: "min(440px, 92vw)", maxHeight: "85vh", overflowY: "auto" }}
      >
        <div className="row-between" style={{ marginBottom: 14 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>
            {isEdit ? "Edit folder" : "New folder"}
          </h2>
          <button
            className="btn ghost btn-icon"
            onClick={onClose}
            title="Close"
            style={{ width: 28, height: 28 }}
          >
            <X size={15} />
          </button>
        </div>

        <label
          style={{ display: "block", fontSize: 12.5, fontWeight: 500, marginBottom: 6 }}
        >
          Folder name
        </label>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
          }}
          maxLength={50}
          placeholder="e.g. Stage Management"
          style={{
            width: "100%",
            fontSize: 14,
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-s)",
            padding: "8px 10px",
            background: "var(--bg-elev)",
            color: "var(--ink)",
            outline: "none",
          }}
        />

        <div style={{ marginTop: 16 }}>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
              fontSize: 13.5,
              fontWeight: 500,
            }}
          >
            <input
              type="checkbox"
              checked={restricted}
              onChange={(e) => setRestricted(e.target.checked)}
              style={{ accentColor: "var(--accent)" }}
            />
            <Lock size={14} style={{ color: "var(--ink-3)" }} />
            Restrict to specific roles
          </label>
          <p
            style={{
              fontSize: 11.5,
              color: "var(--ink-3)",
              margin: "4px 0 0 24px",
            }}
          >
            {restricted
              ? "Only the selected roles (and admins/producers) can see this folder and its files."
              : "Everyone on the production can see this folder."}
          </p>
        </div>

        {restricted && (
          <div
            style={{
              marginTop: 12,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 6,
            }}
          >
            {RESTRICTABLE_ROLES.map((role) => {
              const on = roles.has(role);
              return (
                <label
                  key={role}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 13,
                    padding: "7px 10px",
                    borderRadius: "var(--radius-s)",
                    border: `1px solid ${on ? "var(--accent)" : "var(--border)"}`,
                    background: on ? "var(--c-clay-soft)" : "transparent",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => toggleRole(role)}
                    style={{ accentColor: "var(--accent)" }}
                  />
                  {ROLE_LABELS[role]}
                </label>
              );
            })}
          </div>
        )}

        {error && (
          <p style={{ fontSize: 12, color: "var(--c-clay)", marginTop: 12 }}>
            {error}
          </p>
        )}

        <div
          className="row"
          style={{ justifyContent: "flex-end", gap: 8, marginTop: 18 }}
        >
          <button className="btn" onClick={onClose} disabled={pending}>
            Cancel
          </button>
          <button className="btn primary" onClick={save} disabled={pending}>
            {pending ? "Saving…" : isEdit ? "Save changes" : "Create folder"}
          </button>
        </div>

        {!restricted && !isEdit && (
          <p
            style={{
              fontSize: 11,
              color: "var(--ink-4)",
              marginTop: 12,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Users size={12} /> Visible to the whole production team.
          </p>
        )}
      </div>
    </div>,
    document.body,
  );
}
