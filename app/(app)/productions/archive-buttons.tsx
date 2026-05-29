"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import {
  archiveProduction,
  unarchiveProduction,
} from "@/features/productions/actions";

export function ArchiveProductionButton({
  productionId,
  productionTitle,
}: {
  productionId: string;
  productionTitle: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (
      !window.confirm(
        `Archive "${productionTitle}"? You can restore it from the Archived section any time. Reports and history are preserved.`,
      )
    ) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await archiveProduction(productionId);
      if (result.error) {
        setError(result.error);
        window.alert(result.error);
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
      title="Archive production"
      aria-label={`Archive ${productionTitle}`}
      className="prod-card-archive"
    >
      <Icon name="Archive" size={14} aria-hidden />
      <span className="sr-only">{error ?? ""}</span>
    </button>
  );
}

export function RestoreProductionButton({
  productionId,
}: {
  productionId: string;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const onClick = () => {
    startTransition(async () => {
      const result = await unarchiveProduction(productionId);
      if (result.error) {
        window.alert(result.error);
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
