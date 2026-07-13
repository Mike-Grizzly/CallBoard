"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteAnnouncement } from "@/features/announcements/actions";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function AnnouncementDeleteButton({
  announcementId,
}: {
  announcementId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  function handleConfirm() {
    setConfirming(false);
    const formData = new FormData();
    formData.set("announcement_id", announcementId);

    startTransition(async () => {
      await deleteAnnouncement(formData);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        disabled={isPending}
        className="btn ghost btn-icon"
        title="Delete announcement"
      >
        <Trash2 size={14} />
      </button>
      <ConfirmDialog
        open={confirming}
        title="Delete announcement?"
        message="This announcement will be removed for everyone it was sent to."
        confirmLabel="Delete announcement"
        danger
        busy={isPending}
        onConfirm={handleConfirm}
        onCancel={() => setConfirming(false)}
      />
    </>
  );
}
