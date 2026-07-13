"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import {
  archiveProduction,
  unarchiveProduction,
  deleteProduction,
  restoreDeletedProduction,
} from "@/features/productions/actions";

// These share the ConfirmDialog copy + inline-error pattern with
// production-card-menu.tsx (R6): one confirm implementation for
// archive/delete/restore, no native confirm()/alert().

export function ArchiveProductionButton({
  productionId,
  productionTitle,
}: {
  productionId: string;
  productionTitle: string;
}) {
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const onConfirm = () => {
    setError(null);
    startTransition(async () => {
      const result = await archiveProduction(productionId);
      if (result.error) {
        setError(result.error);
        return;
      }
      setConfirming(false);
      router.refresh();
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setConfirming(true);
        }}
        disabled={pending}
        title="Archive production"
        aria-label={`Archive ${productionTitle}`}
        className="prod-card-archive"
      >
        <Icon name="Archive" size={14} aria-hidden />
      </button>
      <ConfirmDialog
        open={confirming}
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
        onConfirm={onConfirm}
        onCancel={() => {
          setConfirming(false);
          setError(null);
        }}
      />
    </>
  );
}

export function RestoreProductionButton({
  productionId,
}: {
  productionId: string;
}) {
  const [pending, startTransition] = useTransition();
  const toast = useToast();
  const router = useRouter();

  const onClick = () => {
    startTransition(async () => {
      const result = await unarchiveProduction(productionId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="btn"
    >
      <Icon name="RefreshCw" size={13} aria-hidden />
      {pending ? "Restoring..." : "Restore"}
    </button>
  );
}

/**
 * Delete (trash) a production. Admin-only, more destructive than archive —
 * so the confirm spells out the 30-day recovery window.
 */
export function DeleteProductionButton({
  productionId,
  productionTitle,
}: {
  productionId: string;
  productionTitle: string;
}) {
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const onConfirm = () => {
    setError(null);
    startTransition(async () => {
      const result = await deleteProduction(productionId);
      if (result.error) {
        setError(result.error);
        return;
      }
      setConfirming(false);
      router.refresh();
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setConfirming(true);
        }}
        disabled={pending}
        title="Delete production"
        aria-label={`Delete ${productionTitle}`}
        className="prod-card-delete"
      >
        <Icon name="Trash2" size={14} aria-hidden />
      </button>
      <ConfirmDialog
        open={confirming}
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
        onConfirm={onConfirm}
        onCancel={() => {
          setConfirming(false);
          setError(null);
        }}
      />
    </>
  );
}

/** Restore a soft-deleted production from the "Recently deleted" section. */
export function RestoreDeletedProductionButton({
  productionId,
}: {
  productionId: string;
}) {
  const [pending, startTransition] = useTransition();
  const toast = useToast();
  const router = useRouter();

  const onClick = () => {
    startTransition(async () => {
      const result = await restoreDeletedProduction(productionId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <button type="button" onClick={onClick} disabled={pending} className="btn">
      <Icon name="RefreshCw" size={13} aria-hidden />
      {pending ? "Restoring..." : "Restore"}
    </button>
  );
}
