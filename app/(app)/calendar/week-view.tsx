"use client";

import { type CSSProperties, useEffect, useRef } from "react";
import { Icon } from "@/components/ui/icon";
import {
  type CalEvent,
  DAY_END_HOUR,
  DAY_START_HOUR,
  HOUR_PX,
  WEEKDAYS,
  addDays,
  fmtTime,
  minToY,
  sameYMD,
  startOfWeek,
  ymd,
} from "./utils";

export function WeekView({
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
  const start = startOfWeek(cursor);
  const startKey = ymd(start);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const hours = Array.from(
    { length: DAY_END_HOUR - DAY_START_HOUR + 1 },
    (_, i) => DAY_START_HOUR + i,
  );

  // "Today first" + exact column sizing. Percentage grid tracks inside a
  // horizontally-overflowing scroller resolve unreliably (they can size
  // against the grid's own overflowing width, making columns too wide and
  // breaking snap). So we measure the scroll port and set an exact px column
  // width: 3 visible on phone, 5 on tablet, all 7 on desktop. After sizing we
  // align the target day (today, else the navigated day) to just past the
  // frozen gutter.
  const hasToday = days.some((d) => sameYMD(d, today));
  const targetDate = hasToday ? today : cursor;
  const scrollRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sc = scrollRef.current;
    const grid = gridRef.current;
    if (!sc || !grid) return;

    const layout = () => {
      const w = sc.clientWidth;
      let count = 7;
      let gutter = 60;
      if (w <= 720) {
        count = 3;
        gutter = 52;
      } else if (w <= 1100) {
        count = 5;
        gutter = 60;
      }
      const dayW = Math.max(64, (w - gutter) / count);
      const gutterStr = `${gutter}px`;
      const dayStr = `${dayW}px`;
      if (grid.style.getPropertyValue("--week-gutter-w") !== gutterStr) {
        grid.style.setProperty("--week-gutter-w", gutterStr);
      }
      if (grid.style.getPropertyValue("--week-day-w") !== dayStr) {
        grid.style.setProperty("--week-day-w", dayStr);
      }
      // Size the grid box to its columns so the sticky time-gutter's
      // containing block spans the whole strip and stays pinned all the way
      // to the last day (otherwise it detaches at the far right).
      if (grid.style.width !== "max-content") {
        grid.style.width = "max-content";
      }

      const target = sc.querySelector<HTMLElement>('[data-target="1"]');
      if (target && sc.scrollWidth > sc.clientWidth + 1) {
        const left =
          sc.scrollLeft +
          (target.getBoundingClientRect().left -
            sc.getBoundingClientRect().left) -
          gutter;
        sc.scrollTo({ left: Math.max(0, left), behavior: "auto" });
      } else {
        sc.scrollLeft = 0;
      }
    };

    layout();
    const ro = new ResizeObserver(layout);
    ro.observe(sc);
    return () => ro.disconnect();
  }, [startKey]);

  return (
    <div className="week">
      <div className="week-scroll" ref={scrollRef}>
        <div className="week-grid" ref={gridRef}>
          <div className="week-corner" />
          {days.map((d, i) => {
            const isToday = sameYMD(d, today);
            return (
              <div
                key={`h-${i}`}
                className="week-day-h"
                data-today={isToday ? "1" : "0"}
              >
                <span className="week-day-wd">{WEEKDAYS[d.getDay()]}</span>
                <span className="week-day-num">{d.getDate()}</span>
              </div>
            );
          })}

          <div className="week-gutter">
            {hours.map((h) => (
              <div key={h} className="hour-label" style={{ height: HOUR_PX }}>
                {h === 12 ? "12 PM" : h > 12 ? `${h - 12} PM` : `${h} AM`}
              </div>
            ))}
          </div>
          {days.map((d, i) => {
            const dayKey = ymd(d);
            const dayEvents = events.filter(
              (e) => e.date === dayKey && !e.allDay,
            );
            const allDay = events.filter((e) => e.date === dayKey && e.allDay);
            const isToday = sameYMD(d, today);
            return (
              <div
                key={`c-${i}`}
                className="week-col"
                data-today={isToday ? "1" : "0"}
                data-target={sameYMD(d, targetDate) ? "1" : "0"}
                style={{
                  height: HOUR_PX * (DAY_END_HOUR - DAY_START_HOUR + 1),
                }}
              >
                {hours.map((h) => (
                  <div
                    key={h}
                    className="hour-line"
                    style={{ height: HOUR_PX }}
                  />
                ))}
                {isToday && <NowLine />}
                {allDay.map((e) => (
                  <button
                    key={e.id}
                    className="week-allday"
                    onClick={() => onSelect(e)}
                  >
                    <Icon name="Clock" className="ico" width={10} height={10} />{" "}
                    {e.title}
                  </button>
                ))}
                {dayEvents.map((e) => (
                  <WeekEvent
                    key={e.id}
                    event={e}
                    onClick={() => onSelect(e)}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function NowLine() {
  const now = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();
  const top = minToY(mins - DAY_START_HOUR * 60, HOUR_PX);
  const label = fmtTime(
    `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
  );
  return (
    <div className="now-line" style={{ top }}>
      <span className="now-dot" />
      <span className="now-time">{label}</span>
    </div>
  );
}

function WeekEvent({
  event,
  onClick,
}: {
  event: CalEvent;
  onClick: () => void;
}) {
  const [h, m] = event.time.split(":").map(Number);
  const startMin = h * 60 + m;
  const top = minToY(startMin - DAY_START_HOUR * 60, HOUR_PX);
  const height = Math.max(28, minToY(event.durMin, HOUR_PX) - 2);
  const isShort = event.durMin <= 45;
  const style: CSSProperties = {
    top,
    height,
    ["--evt-color" as unknown as string]: event.productionColorVar,
  };
  return (
    <button
      className="week-event"
      data-short={isShort ? "1" : "0"}
      onClick={onClick}
      style={style}
    >
      <div className="week-event-spine" />
      <div>
        <div className="week-event-time">{fmtTime(event.time)}</div>
        <div className="week-event-title truncate">{event.title}</div>
        {!isShort && event.loc && (
          <div className="week-event-loc truncate">{event.loc}</div>
        )}
      </div>
    </button>
  );
}
