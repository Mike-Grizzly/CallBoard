"use client";

import { useTransition } from "react";
import { Pin, PinOff } from "lucide-react";
import { togglePin } from "@/features/announcements/actions";

export function AnnouncementPinButton({
  announcementId,
  pinned,
}: {
  announcementId: string;
  pinned: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    const formData = new FormData();
    formData.set("announcement_id", announcementId);

    startTransition(async () => {
      await togglePin(formData);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="btn ghost btn-icon"
      title={pinned ? "Unpin announcement" : "Pin announcement"}
      style={pinned ? { color: "var(--accent)" } : undefined}
    >
      {pinned ? <PinOff size={14} /> : <Pin size={14} />}
    </button>
  );
}
