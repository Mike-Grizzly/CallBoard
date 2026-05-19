"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { type CalEvent, fmtTime, parseYmd } from "./utils";

export function EventDrawer({
  event,
  onClose,
}: {
  event: CalEvent;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const endLabel = (() => {
    if (event.allDay) return "All day";
    const [h, m] = event.time.split(":").map(Number);
    const total = h * 60 + m + event.durMin;
    const eh = Math.floor(total / 60) % 24;
    const em = total % 60;
    const endStr = `${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}`;
    const hr = Math.floor(event.durMin / 60);
    const mn = event.durMin % 60;
    const dur = `${hr}h${mn ? " " + mn + "m" : ""}`.trim();
    return `${fmtTime(event.time)} – ${fmtTime(endStr)}  ·  ${dur}`;
  })();

  return (
    <>
      <div className="cal-scrim" onClick={onClose} />
      <aside className="cal-drawer">
        <header className="cal-drawer-h">
          <span className="cal-drawer-type">
            <Icon name="CalendarDays" className="ico" width={12} height={12} />
            Rehearsal
          </span>
          <button
            className="btn ghost btn-icon"
            onClick={onClose}
            aria-label="Close"
          >
            <Icon name="X" className="ico" />
          </button>
        </header>

        <h2 className="cal-drawer-title">{event.title}</h2>

        <Link
          href={`/productions/${event.productionSlug}`}
          className="cal-drawer-prod"
        >
          <span
            className="prod-dot"
            style={{
              background: event.productionColorVar,
              width: 8,
              height: 8,
              borderRadius: "50%",
            }}
          />
          {event.productionTitle}
        </Link>

        <dl className="cal-drawer-meta">
          <dt>When</dt>
          <dd>
            {parseYmd(event.date).toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
            <br />
            {endLabel}
          </dd>

          {event.loc && (
            <>
              <dt>Where</dt>
              <dd>{event.loc}</dd>
            </>
          )}
        </dl>

        <div className="cal-drawer-actions">
          <Link
            href={`/productions/${event.productionSlug}/calls/${event.id}/edit`}
            className="btn primary"
          >
            <Icon name="PenLine" className="ico" />
            Edit
          </Link>
          <Link
            href={`/productions/${event.productionSlug}/calls`}
            className="btn"
          >
            <Icon name="CalendarDays" className="ico" />
            Open schedule
          </Link>
        </div>
      </aside>
    </>
  );
}
