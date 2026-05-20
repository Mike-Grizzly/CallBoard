"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteAnnouncement } from "@/features/announcements/actions";

export function AnnouncementDeleteButton({
  announcementId,
}: {
  announcementId: string;
}) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm("Delete this announcement?")) return;

    const formData = new FormData();
    formData.set("announcement_id", announcementId);

    startTransition(async () => {
      await deleteAnnouncement(formData);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="btn ghost btn-icon"
      title="Delete announcement"
    >
      <Trash2 size={14} />
    </button>
  );
}
