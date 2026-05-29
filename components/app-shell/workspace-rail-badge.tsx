"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { switchOrganization } from "@/features/workspace/actions";
import type { UserMembership } from "@/features/workspace/queries";

type Props = {
  currentOrgId: string;
  currentOrgName: string;
  memberships: UserMembership[];
};

export function WorkspaceRailBadge({
  currentOrgId,
  currentOrgName,
  memberships,
}: Props) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);

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

  const others = memberships.filter((m) => m.organizationId !== currentOrgId);

  return (
    <div className="workspace-badge" ref={ref}>
      <button
        type="button"
        className="workspace-badge-button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={pending}
        title={currentOrgName}
      >
        <Icon name="Building2" size={14} aria-hidden />
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
              >
                <Icon name="Building2" size={13} aria-hidden />
                <span className="truncate">{m.organizationName}</span>
              </button>
            ))
          ) : (
            <div className="workspace-badge-menu-empty">
              No other workspaces yet.
            </div>
          )}
          {error && <div className="workspace-badge-menu-error">{error}</div>}
        </div>
      )}
    </div>
  );
}
