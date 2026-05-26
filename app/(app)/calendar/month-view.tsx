"use client";

import { useIsPhone } from "@/lib/use-is-phone";
import {
  type CalEvent,
  MONTHS,
  WEEKDAYS,
  addDays,
  fmtTime,
  sameYMD,
  startOfMonth,
  ymd,
} from "./utils";

export function MonthView({
  cursor,
  today,
  events,
  onSelect,
  jumpDay,
}: {
  cursor: Date;
  today: Date;
  events: CalEvent[];
  onSelect: (e: CalEvent) => void;
  jumpDay: (d: Date) => void;
}) {
  const first = startOfMonth(cursor);
  const startGrid = addDays(first, -first.getDay());
  const days = Array.from({ length: 42 }, (_, i) => addDays(startGrid, i));
  const isPhone = useIsPhone();
  const MAX_PIPS = 5;

  return (
    <div className="month">
      <div className="month-head">
        {WEEKDAYS.map((d) => (
          <div key={d} className="month-h-cell">
            {d}
          </div>
        ))}
      </div>
      <div className="month-grid">
        {days.map((d, i) => {
          const inMonth = d.getMonth() === cursor.getMonth();
          const isToday = sameYMD(d, today);
          const dayEvents = events.filter((e) => e.date === ymd(d));
          const dateLabel =
            d.getDate() === 1
              ? `${MONTHS[d.getMonth()].slice(0, 3)} 1`
              : String(d.getDate());

          // On phones the cell is a single button (whole-cell tap target)
          // and events render as compact pip dots — the demo's pattern.
          // Tap opens the day-detail bottom sheet (handled by jumpDay).
          if (isPhone) {
            return (
              <button
                key={i}
                type="button"
                className="month-cell month-cell-phone"
                data-mute={!inMonth ? "1" : "0"}
                data-today={isToday ? "1" : "0"}
                onClick={() => jumpDay(d)}
                aria-label={`${dateLabel}, ${dayEvents.length} event${dayEvents.length === 1 ? "" : "s"}`}
              >
                <span className="month-cell-num-m">{dateLabel}</span>
                <span className="month-pips">
                  {dayEvents.slice(0, MAX_PIPS).map((e) => (
                    <span
                      key={e.id}
                      className="month-pip"
                      style={{ background: e.productionColorVar }}
                    />
                  ))}
                  {dayEvents.length > MAX_PIPS && (
                    <span className="month-pip-more">
                      +{dayEvents.length - MAX_PIPS}
                    </span>
                  )}
                </span>
              </button>
            );
          }

          return (
            <div
              key={i}
              className="month-cell"
              data-mute={!inMonth ? "1" : "0"}
              data-today={isToday ? "1" : "0"}
            >
              <div className="month-cell-h">
                <button
                  className="month-cell-num"
                  onClick={() => jumpDay(d)}
                >
                  {dateLabel}
                </button>
              </div>
              <div className="month-cell-events">
                {dayEvents.slice(0, 4).map((e) => (
                  <MonthChip
                    key={e.id}
                    event={e}
                    onClick={() => onSelect(e)}
                  />
                ))}
                {dayEvents.length > 4 && (
                  <button
                    className="month-more"
                    onClick={() => jumpDay(d)}
                  >
                    +{dayEvents.length - 4} more
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MonthChip({ event, onClick }: { event: CalEvent; onClick: () => void }) {
  return (
    <button className="month-chip" onClick={onClick}>
      <span
        className="month-chip-dot"
        style={{ background: event.productionColorVar }}
      />
      <span className="month-chip-time mono">
        {event.allDay ? "all" : fmtTime(event.time).replace(" ", "")}
      </span>
      <span className="month-chip-title truncate">{event.title}</span>
    </button>
  );
}
