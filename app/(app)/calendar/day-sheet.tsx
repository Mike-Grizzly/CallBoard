"use client";

import { useEffect } from "react";
import { Icon } from "@/components/ui/icon";
import { type CalEvent, fmtTime } from "./utils";

/**
 * Mobile day-detail bottom sheet. Tapping a day cell in the month
 * view at phone widths opens this — a short list of the day's events
 * — instead of jumping the whole view to the day view. Each event tap
 * dismisses the sheet and opens the full `EventDrawer` for that event.
 *
 * Phone-only by design: `CalendarClient` only opens it when
 * `useIsPhone()` is true.
 */
export function DaySheet({
  day,
  events,
  onClose,
  onSelectEvent,
}: {
  day: Date;
  events: CalEvent[];
  onClose: () => void;
  onSelectEvent: (event: CalEvent) => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const sorted = [...events].sort((a, b) => {
    if (a.allDay && !b.allDay) return -1;
    if (!a.allDay && b.allDay) return 1;
    return a.time.localeCompare(b.time);
  });

  const dayLabel = day.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      <div className="cal-scrim" onClick={onClose} />
      <div className="cal-day-sheet" role="dialog" aria-label={dayLabel}>
        <div className="cal-day-sheet-grip" aria-hidden />
        <header className="cal-day-sheet-h">
          <h2>{dayLabel}</h2>
          <button
            type="button"
            onClick={onClose}
            className="btn ghost btn-icon"
            aria-label="Close"
          >
            <Icon name="X" className="ico" />
          </button>
        </header>
        {sorted.length === 0 ? (
          <div className="cal-day-sheet-empty">No events scheduled.</div>
        ) : (
          <div className="cal-day-sheet-list">
            {sorted.map((e) => (
              <button
                key={e.id}
                type="button"
                className="cal-day-sheet-event"
                onClick={() => onSelectEvent(e)}
              >
                <span
                  className="cal-day-event-spine"
                  style={{ background: e.productionColorVar }}
                />
                <div className="cal-day-event-body">
                  <div className="cal-day-event-time mono">
                    {e.allDay ? "All day" : fmtTime(e.time)}
                  </div>
                  <div className="cal-day-event-title">{e.title}</div>
                  {e.loc ? (
                    <div className="cal-day-event-loc">{e.loc}</div>
                  ) : null}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
