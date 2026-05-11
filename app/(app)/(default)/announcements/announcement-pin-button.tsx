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
      className="rounded p-1.5 text-[color:var(--muted-foreground)] transition-colors hover:bg-[color:var(--muted)] hover:text-[color:var(--foreground)]"
      title={pinned ? "Unpin announcement" : "Pin announcement"}
    >
      {pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
    </button>
  );
}
