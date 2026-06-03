"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Megaphone, Check } from "lucide-react";
import { acknowledgeAnnouncement } from "@/features/announcements/actions";

type BannerItem = {
  id: string;
  title: string;
  scope: string;
  href: string;
};

/**
 * Shows the most recent unacknowledged announcement. Acknowledging optimistically
 * advances to the next one (and hides the banner when the queue is empty) while
 * recording the ack in the background.
 */
export function AnnouncementBannerClient({ items }: { items: BannerItem[] }) {
  const [queue, setQueue] = useState(items);
  const [, startTransition] = useTransition();

  if (queue.length === 0) return null;

  const current = queue[0];
  const remaining = queue.length - 1;

  function acknowledge() {
    const id = current.id;
    setQueue((q) => q.slice(1));
    startTransition(async () => {
      await acknowledgeAnnouncement(id);
    });
  }

  return (
    <div className="ann-banner" role="status">
      <div className="ann-banner-ico">
        <Megaphone size={16} aria-hidden />
      </div>
      <div className="ann-banner-body">
        <span className="ann-banner-eyebrow">
          New announcement · {current.scope}
          {remaining > 0 ? ` · +${remaining} more` : ""}
        </span>
        <Link href={current.href} className="ann-banner-title">
          {current.title}
        </Link>
      </div>
      <div className="ann-banner-actions">
        <Link href={current.href} className="ann-banner-link">
          View
        </Link>
        <button
          type="button"
          className="ann-banner-ack"
          onClick={acknowledge}
        >
          <Check size={14} aria-hidden /> Acknowledge
        </button>
      </div>
    </div>
  );
}
