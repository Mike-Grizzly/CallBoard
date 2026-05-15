"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { FileText, File, Pencil, CheckSquare, Pin } from "lucide-react";
import type { PinRow } from "@/features/pins/queries";
import { pinItem } from "@/features/pins/actions";

function PinIcon({ itemType, subtype }: { itemType: string; subtype: string }) {
  if (itemType === "report") return <FileText size={16} aria-hidden />;
  if (itemType === "note" && subtype === "todo")
    return <CheckSquare size={16} aria-hidden />;
  if (itemType === "note") return <Pencil size={16} aria-hidden />;
  return <File size={16} aria-hidden />;
}

function pinHref(pin: PinRow): string {
  const base = `/productions/${pin.productionSlug}`;
  if (pin.itemType === "report") return `${base}/reports/${pin.itemId}`;
  if (pin.itemType === "document") return `${base}/documents/${pin.itemId}`;
  return `${base}/notes`;
}

function formatPinnedDate(date: Date | string): string {
  const d = date instanceof Date ? date : new Date(date as string);
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function PinnedSection({ pins: initialPins }: { pins: PinRow[] }) {
  const [pins, setPins] = useState(initialPins);
  const [, startTransition] = useTransition();

  function handleUnpin(e: React.MouseEvent, pin: PinRow) {
    e.preventDefault();
    e.stopPropagation();
    setPins((prev) => prev.filter((p) => p.pinId !== pin.pinId));
    startTransition(async () => { await pinItem(pin.itemType, pin.itemId, false); });
  }

  if (!pins.length) return null;

  return (
    <section className="home-section">
      <header className="home-section-head">
        <div>
          <div className="h-eyebrow">Pinned</div>
          <h2 className="h-section">Always at hand</h2>
        </div>
      </header>

      <div className="pin-grid">
        {pins.map((pin) => (
          <Link
            key={pin.pinId}
            href={pinHref(pin)}
            className="pin-card"
            data-kind={pin.itemType}
          >
            <div className="pin-icon">
              <PinIcon itemType={pin.itemType} subtype={pin.subtype} />
            </div>
            <div className="pin-body">
              <div className="pin-title truncate">{pin.title}</div>
              <div className="pin-meta truncate">{pin.productionTitle}</div>
            </div>
            <div className="pin-when">{formatPinnedDate(pin.pinnedAt)}</div>
            <button
              type="button"
              onClick={(e) => handleUnpin(e, pin)}
              title="Unpin"
              className="pin-unpin-btn"
              aria-label="Unpin"
            >
              <Pin size={12} />
            </button>
          </Link>
        ))}
      </div>
    </section>
  );
}
