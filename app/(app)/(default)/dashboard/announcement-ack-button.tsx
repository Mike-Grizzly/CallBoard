"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { acknowledgeAnnouncement } from "@/features/announcements/actions";

/**
 * Acknowledge toggle + progress bar for one announcement. Optimistic: the
 * bar and "N / M" update immediately, the server call fires in the
 * background. Shared by the dashboard bento and the global announcements page.
 */
export function AnnouncementAckButton({
  announcementId,
  acked: ackedInitial,
  count,
  total,
  compact = false,
}: {
  announcementId: string;
  acked: boolean;
  count: number;
  total: number;
  compact?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [acked, setAcked] = useState(ackedInitial);
  const [n, setN] = useState(count);

  function toggle() {
    const next = !acked;
    setAcked(next);
    setN((c) => Math.max(0, c + (next ? 1 : -1)));
    startTransition(async () => {
      await acknowledgeAnnouncement(announcementId);
    });
  }

  const pct = total > 0 ? Math.round((n / total) * 100) : 0;

  return (
    <div className="dd-ann-foot">
      <button
        type="button"
        className={"dd-ack-btn" + (acked ? " is-acked" : "")}
        onClick={toggle}
        disabled={pending}
      >
        <Check size={13} aria-hidden />
        {acked ? "Acknowledged" : "Acknowledge"}
      </button>
      {!compact && (
        <>
          <div className="dd-ann-ack-bar">
            <div className="dd-ann-ack-fill" style={{ width: `${pct}%` }} />
          </div>
          <span className="dd-ann-ack-txt mono">
            {n}/{total}
          </span>
        </>
      )}
    </div>
  );
}
