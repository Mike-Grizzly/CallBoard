"use client";

import { useState, useTransition } from "react";
import { Pin } from "lucide-react";
import { pinItem } from "./actions";

export function PinButton({
  itemType,
  itemId,
  initialPinned,
}: {
  itemType: string;
  itemId: string;
  initialPinned: boolean;
}) {
  const [pinned, setPinned] = useState(initialPinned);
  const [pending, startTransition] = useTransition();

  function handleClick() {
    const next = !pinned;
    setPinned(next);
    startTransition(async () => {
      const result = await pinItem(itemType, itemId);
      setPinned(result.pinned);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="btn ghost"
      title={pinned ? "Unpin from dashboard" : "Pin to dashboard"}
      style={{
        gap: 6,
        color: pinned ? "var(--c-amber)" : undefined,
        opacity: pending ? 0.6 : 1,
      }}
    >
      <Pin size={14} aria-hidden />
      <span>{pinned ? "Pinned" : "Pin"}</span>
    </button>
  );
}
