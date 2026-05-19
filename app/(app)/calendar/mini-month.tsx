"use client";

import { Icon } from "@/components/ui/icon";
import { type CalEvent, MONTHS, addDays, sameYMD, startOfMonth, ymd } from "./utils";

export function MiniMonth({
  cursor,
  setCursor,
  today,
  events,
}: {
  cursor: Date;
  setCursor: (d: Date) => void;
  today: Date;
  events: CalEvent[];
}) {
  // Displayed month follows the cursor; the prev/next buttons move
  // the cursor itself to the 1st of the adjacent month. This avoids
  // a second source of truth for "which month is showing."
  const m = startOfMonth(cursor);
  const first = startOfMonth(m);
  const startGrid = addDays(first, -first.getDay());
  const days = Array.from({ length: 42 }, (_, i) => addDays(startGrid, i));
  const eventDates = new Set(events.map((e) => e.date));

  return (
    <div className="mini-month">
      <div className="mini-month-h">
        <button
          onClick={() =>
            setCursor(new Date(m.getFullYear(), m.getMonth() - 1, 1))
          }
          aria-label="Previous month"
        >
          <Icon name="ChevronLeft" className="ico" width={12} height={12} />
        </button>
        <div>
          {MONTHS[m.getMonth()]} {m.getFullYear()}
        </div>
        <button
          onClick={() =>
            setCursor(new Date(m.getFullYear(), m.getMonth() + 1, 1))
          }
          aria-label="Next month"
        >
          <Icon name="ChevronRight" className="ico" width={12} height={12} />
        </button>
      </div>
      <div className="mini-month-wk">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>
      <div className="mini-month-grid">
        {days.map((d, i) => {
          const inMonth = d.getMonth() === m.getMonth();
          const isToday = sameYMD(d, today);
          const isCursor = sameYMD(d, cursor);
          const hasEvents = eventDates.has(ymd(d));
          return (
            <button
              key={i}
              className="mini-day"
              data-mute={!inMonth ? "1" : "0"}
              data-today={isToday ? "1" : "0"}
              data-active={isCursor ? "1" : "0"}
              onClick={() => setCursor(d)}
            >
              {d.getDate()}
              {hasEvents && <span className="mini-day-pip" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
