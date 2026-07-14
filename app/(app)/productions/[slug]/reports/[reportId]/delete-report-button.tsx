"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { deleteReport } from "@/features/reports/actions";

/**
 * Move a report to the production trash (soft delete — restorable from the
 * trash drawer for 30 days). Rendered only for report managers; the server
 * action re-checks `reports:create` + report access regardless (R2).
 */
export function DeleteReportButton({
  reportId,
  slug,
}: {
  reportId: string;
  slug: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const onConfirm = () => {
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("report_id", reportId);
      const result = await deleteReport(fd);
      if (result.error) {
        setError(result.error);
        return;
      }
      setConfirming(false);
      router.push(`/productions/${slug}/reports`);
      router.refresh();
    });
  };

  return (
    <>
      <button
        type="button"
        className="btn ghost btn-icon"
        title="Move report to trash"
        aria-label="Move report to trash"
        disabled={pending}
        onClick={() => setConfirming(true)}
      >
        <Icon name="Trash2" size={14} aria-hidden />
      </button>
      <ConfirmDialog
        open={confirming}
        danger
        title="Move report to trash?"
        confirmLabel="Move to trash"
        busy={pending}
        message={
          <>
            The report disappears for everyone it was distributed to. You can
            restore it from the production <strong>trash drawer</strong> for 30
            days, after which it’s permanently removed.
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
