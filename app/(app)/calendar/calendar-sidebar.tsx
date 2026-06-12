"use client";

import { useMemo } from "react";
import type { Production } from "./calendar-client";
import { type CalEvent, fmtTime, parseYmd } from "./utils";
import { MiniMonth } from "./mini-month";

export function CalSidebar({
  cursor,
  setCursor,
  today,
  productions,
  prodFilter,
  setProdFilter,
  events,
}: {
  cursor: Date;
  setCursor: (d: Date) => void;
  today: Date;
  productions: Production[];
  prodFilter: Set<string>;
  setProdFilter: (s: Set<string>) => void;
  events: CalEvent[];
}) {
  const toggle = (id: string) => {
    const next = new Set(prodFilter);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setProdFilter(next);
  };

  const upcoming = useMemo(
    () =>
      events
        .map((e) => ({ ...e, _d: parseYmd(e.date) }))
        .filter((e) => e._d >= today)
        .sort((a, b) => +a._d - +b._d || a.time.localeCompare(b.time))
        .slice(0, 5),
    [events, today],
  );

  return (
    <aside className="cal-side">
      <div>
        <MiniMonth
          cursor={cursor}
          setCursor={setCursor}
          today={today}
          events={events}
        />
      </div>

      <div>
        <div className="cal-side-h">Productions</div>
        {productions.map((p) => {
          const on = prodFilter.has(p.id);
          return (
            <label key={p.id} className="cal-filter">
              <input
                type="checkbox"
                checked={on}
                onChange={() => toggle(p.id)}
              />
              <span
                className="cal-filter-swatch"
                style={{
                  background: on ? p.colorVar : "transparent",
                  borderColor: p.colorVar,
                }}
              />
              <span className="cal-filter-label truncate">{p.title}</span>
            </label>
          );
        })}
      </div>

      <div>
        <div className="cal-side-h">Upcoming</div>
        {upcoming.length === 0 ? (
          <div
            style={{
              fontSize: 12,
              color: "var(--ink-4)",
            }}
          >
            Nothing on the horizon.
          </div>
        ) : (
          upcoming.map((e) => (
            <div key={e.id} className="cal-upcoming">
              <div
                className="cal-up-spine"
                style={{ background: e.productionColorVar }}
              />
              <div className="cal-up-body">
                <div className="cal-up-when">
                  {e._d.toLocaleDateString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                  {!e.allDay && ` · ${fmtTime(e.time)}`}
                </div>
                <div className="cal-up-title truncate">{e.title}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
