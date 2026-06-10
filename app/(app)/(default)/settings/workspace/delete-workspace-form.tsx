"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { deleteWorkspace } from "@/features/workspace/actions";

/**
 * Danger zone: soft-delete the workspace behind a type-the-name confirmation.
 * The workspace is recoverable via support for 30 days; this UI makes that
 * promise explicit so the step doesn't feel irreversible-but-casual.
 */
export function DeleteWorkspaceForm({
  workspaceName,
}: {
  workspaceName: string;
}) {
  const [open, setOpen] = useState(false);
  const [confirmName, setConfirmName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const matches = confirmName.trim() === workspaceName;

  const onConfirm = () => {
    setError(null);
    startTransition(async () => {
      const result = await deleteWorkspace(confirmName);
      if (result.error) {
        setError(result.error);
        return;
      }
      // Auth re-resolves the active workspace from the server-updated
      // selection; land on the dashboard and refresh so the layout reflects it.
      router.push("/dashboard");
      router.refresh();
    });
  };

  return (
    <div
      className="card card-pad"
      style={{ borderColor: "color-mix(in oklch, var(--c-clay) 45%, var(--border))" }}
    >
      <h3 style={{ fontSize: 14, margin: 0, fontWeight: 600, color: "var(--c-clay)" }}>
        Delete workspace
      </h3>
      <p className="muted" style={{ fontSize: 13, marginTop: 6, marginBottom: 12 }}>
        Removes <strong>{workspaceName}</strong> and everything in it for every
        member. It&apos;s recoverable via support for 30 days, after which it is
        permanently removed.
      </p>

      {!open ? (
        <button
          type="button"
          className="btn"
          style={{ color: "var(--c-clay)", borderColor: "var(--c-clay)" }}
          onClick={() => {
            setOpen(true);
            setError(null);
          }}
        >
          <Icon name="Trash2" size={14} aria-hidden /> Delete workspace
        </button>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {error && <div className="auth-error">{error}</div>}
          <label className="label" htmlFor="confirm-name">
            Type <strong>{workspaceName}</strong> to confirm
          </label>
          <input
            id="confirm-name"
            type="text"
            className="field"
            value={confirmName}
            onChange={(e) => setConfirmName(e.target.value)}
            placeholder={workspaceName}
            autoComplete="off"
          />
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              className="btn primary"
              style={{ background: "var(--c-clay)", borderColor: "var(--c-clay)" }}
              disabled={!matches || pending}
              onClick={onConfirm}
            >
              {pending ? "Deleting..." : "Permanently delete"}
            </button>
            <button
              type="button"
              className="btn"
              disabled={pending}
              onClick={() => {
                setOpen(false);
                setConfirmName("");
                setError(null);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
