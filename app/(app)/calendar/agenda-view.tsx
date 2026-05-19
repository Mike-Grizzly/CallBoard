"use client";

import {
  type CalEvent,
  MONTHS,
  WEEKDAYS,
  addDays,
  fmtTime,
  sameYMD,
  startOfWeek,
  ymd,
} from "./utils";

export function AgendaView({
  cursor,
  today,
  events,
  onSelect,
}: {
  cursor: Date;
  today: Date;
  events: CalEvent[];
  onSelect: (e: CalEvent) => void;
}) {
  // 21 days, anchored to start of cursor's week
  const start = startOfWeek(cursor);
  const range = Array.from({ length: 21 }, (_, i) => addDays(start, i));
  const anyShown = range.some((d) => events.some((e) => e.date === ymd(d)));

  if (!anyShown) {
    return (
      <div className="agenda">
        <div
          style={{
            padding: "48px 18px",
            textAlign: "center",
            fontSize: 13,
            color: "var(--ink-3)",
          }}
        >
          No calls in this window.
        </div>
      </div>
    );
  }

  return (
    <div className="agenda">
      {range.map((d) => {
        const key = ymd(d);
        const list = events
          .filter((e) => e.date === key)
          .sort((a, b) => a.time.localeCompare(b.time));
        if (list.length === 0) return null;
        const isToday = sameYMD(d, today);
        return (
          <div key={key} className="agenda-day">
            <div className="agenda-day-h" data-today={isToday ? "1" : "0"}>
              <div className="agenda-day-num">{d.getDate()}</div>
              <div>
                <div className="agenda-day-wd">{WEEKDAYS[d.getDay()]}</div>
                <div className="agenda-day-mon">{MONTHS[d.getMonth()]}</div>
              </div>
              {isToday && <span className="agenda-today-pill">Today</span>}
            </div>
            <div className="agenda-list">
              {list.map((e) => (
                <button
                  key={e.id}
                  className="agenda-item"
                  onClick={() => onSelect(e)}
                >
                  <span
                    className="agenda-spine"
                    style={{ background: e.productionColorVar }}
                  />
                  <span className="agenda-time mono">
                    {e.allDay ? "all day" : fmtTime(e.time)}
                  </span>
                  <span className="agenda-title">{e.title}</span>
                  <span className="agenda-loc truncate">{e.loc ?? ""}</span>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
