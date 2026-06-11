"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  archiveProduction,
  deleteProduction,
} from "@/features/productions/actions";

type Confirm = "archive" | "delete" | null;

/**
 * The per-card "⋮" menu on the productions grid — consolidates Archive + Delete
 * into one discoverable control (replacing the two hover icons that overlapped
 * the card text) and routes destructive actions through an on-brand dialog.
 */
export function ProductionCardMenu({
  productionId,
  productionTitle,
  canArchive,
  canDelete,
}: {
  productionId: string;
  productionTitle: string;
  canArchive: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const isOpen = pos !== null;

  function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (isOpen) {
      setPos(null);
      return;
    }
    const rect = btnRef.current!.getBoundingClientRect();
    setPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
  }

  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setPos(null);
    }
    function onDown(e: MouseEvent) {
      if (
        !menuRef.current?.contains(e.target as Node) &&
        !btnRef.current?.contains(e.target as Node)
      ) {
        setPos(null);
      }
    }
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [isOpen]);

  function run(fn: () => Promise<{ error?: string }>) {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (res.error) {
        setError(res.error);
        return;
      }
      setConfirm(null);
      router.refresh();
    });
  }

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        disabled={pending}
        className="prod-card-menu-btn"
        data-open={isOpen ? "1" : undefined}
        title="Production options"
        aria-label={`Options for ${productionTitle}`}
      >
        <Icon name="MoreVertical" size={16} aria-hidden />
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            className="prod-card-menu"
            style={{ top: pos!.top, right: pos!.right }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            {canArchive && (
              <button
                type="button"
                className="prod-card-menu-item"
                onClick={() => {
                  setPos(null);
                  setConfirm("archive");
                }}
              >
                <Icon name="Archive" size={14} aria-hidden />
                Archive
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                className="prod-card-menu-item danger"
                onClick={() => {
                  setPos(null);
                  setConfirm("delete");
                }}
              >
                <Icon name="Trash2" size={14} aria-hidden />
                Delete
              </button>
            )}
          </div>,
          document.body,
        )}

      <ConfirmDialog
        open={confirm === "archive"}
        title={`Archive “${productionTitle}”?`}
        confirmLabel="Archive"
        busy={pending}
        message={
          <>
            It moves to the <strong>Archived</strong> section and can be restored
            any time. Reports and history are preserved.
            {error && <p className="confirm-error">{error}</p>}
          </>
        }
        onConfirm={() => run(() => archiveProduction(productionId))}
        onCancel={() => {
          setConfirm(null);
          setError(null);
        }}
      />

      <ConfirmDialog
        open={confirm === "delete"}
        danger
        title={`Delete “${productionTitle}”?`}
        confirmLabel="Delete"
        busy={pending}
        message={
          <>
            This removes it for everyone in the workspace. You can recover it from{" "}
            <strong>Recently deleted</strong> for 30 days, after which it’s
            permanently removed.
            {error && <p className="confirm-error">{error}</p>}
          </>
        }
        onConfirm={() => run(() => deleteProduction(productionId))}
        onCancel={() => {
          setConfirm(null);
          setError(null);
        }}
      />
    </>
  );
}
