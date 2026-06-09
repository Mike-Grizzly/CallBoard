"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import {
  createWorkspace,
  switchOrganization,
} from "@/features/workspace/actions";
import type { UserMembership } from "@/features/workspace/queries";

type Props = {
  currentOrgId: string;
  currentOrgName: string;
  currentOrgLogoUrl: string | null;
  memberships: UserMembership[];
  alertCounts: Record<string, number>;
};

function Bubble({ n }: { n: number }) {
  if (n <= 0) return null;
  return (
    <span
      aria-label={`${n} new`}
      style={{
        minWidth: 16,
        height: 16,
        padding: "0 4px",
        borderRadius: 999,
        background: "#e5484d",
        color: "#fff",
        fontSize: 10.5,
        fontWeight: 700,
        lineHeight: "16px",
        textAlign: "center",
        flexShrink: 0,
      }}
    >
      {n > 99 ? "99+" : n}
    </span>
  );
}

export function WorkspaceRailBadge({
  currentOrgId,
  currentOrgName,
  currentOrgLogoUrl,
  memberships,
  alertCounts,
}: Props) {
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const createInputRef = useRef<HTMLInputElement>(null);

  // Click-outside to dismiss the menu without trapping focus.
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Reset transient state every time the menu closes so opening it
  // again starts clean.
  useEffect(() => {
    if (!open) {
      setCreating(false);
      setNewName("");
      setError(null);
    }
  }, [open]);

  // When the inline create form appears, focus the input so the user can
  // start typing immediately.
  useEffect(() => {
    if (creating) {
      createInputRef.current?.focus();
    }
  }, [creating]);

  const onPick = (orgId: string) => {
    if (orgId === currentOrgId) {
      setOpen(false);
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await switchOrganization(orgId);
      if (result.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  };

  const onCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const name = newName.trim();
    if (!name) {
      setError("Enter a workspace name.");
      return;
    }
    startTransition(async () => {
      const result = await createWorkspace(name);
      if (result.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  };

  const others = memberships.filter((m) => m.organizationId !== currentOrgId);
  const otherAlertTotal = others.reduce(
    (sum, m) => sum + (alertCounts[m.organizationId] ?? 0),
    0,
  );

  return (
    <div className="workspace-badge" ref={ref} style={{ position: "relative" }}>
      {!open && otherAlertTotal > 0 && (
        <span
          aria-hidden
          style={{ position: "absolute", top: -4, right: -4, zIndex: 2 }}
        >
          <Bubble n={otherAlertTotal} />
        </span>
      )}
      <button
        type="button"
        className="workspace-badge-button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={pending}
        title={
          otherAlertTotal > 0
            ? `${currentOrgName} — ${otherAlertTotal} new in other workspaces`
            : currentOrgName
        }
      >
        {currentOrgLogoUrl ? (
          // Signed URL — `<img>` is fine, see logo-uploader for rationale.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={currentOrgLogoUrl}
            alt=""
            width={16}
            height={16}
            className="workspace-badge-logo"
          />
        ) : (
          <Icon name="Building2" size={14} aria-hidden />
        )}
        <span className="truncate">{currentOrgName}</span>
        <Icon
          name="ChevronDown"
          size={12}
          aria-hidden
          style={{
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 0.15s",
            flexShrink: 0,
          }}
        />
      </button>

      {open && (
        <div className="workspace-badge-menu" role="listbox">
          <div className="workspace-badge-menu-head">Switch workspace</div>
          {others.length > 0 ? (
            others.map((m) => (
              <button
                key={m.organizationId}
                type="button"
                className="workspace-badge-menu-item"
                onClick={() => onPick(m.organizationId)}
                disabled={pending}
                role="option"
                aria-selected={false}
                style={{ display: "flex", alignItems: "center", gap: 8 }}
              >
                <Icon name="Building2" size={13} aria-hidden />
                <span className="truncate" style={{ flex: 1 }}>
                  {m.organizationName}
                </span>
                <Bubble n={alertCounts[m.organizationId] ?? 0} />
              </button>
            ))
          ) : (
            <div className="workspace-badge-menu-empty">
              No other workspaces yet.
            </div>
          )}

          <div className="workspace-badge-menu-divider" />

          {creating ? (
            <form
              onSubmit={onCreate}
              className="workspace-badge-menu-form"
              role="none"
            >
              <input
                ref={createInputRef}
                type="text"
                className="field"
                placeholder="New workspace name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                disabled={pending}
                maxLength={60}
                aria-label="New workspace name"
              />
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  type="submit"
                  className="btn primary"
                  disabled={pending || !newName.trim()}
                  style={{ flex: 1, fontSize: 12.5, padding: "6px 10px" }}
                >
                  {pending ? "Creating..." : "Create"}
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    setCreating(false);
                    setNewName("");
                    setError(null);
                  }}
                  disabled={pending}
                  style={{ fontSize: 12.5, padding: "6px 10px" }}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              className="workspace-badge-menu-item"
              onClick={() => setCreating(true)}
              disabled={pending}
            >
              <Icon name="Plus" size={13} aria-hidden />
              <span>Create workspace</span>
            </button>
          )}

          {error && <div className="workspace-badge-menu-error">{error}</div>}
        </div>
      )}
    </div>
  );
}
