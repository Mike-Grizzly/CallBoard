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

  // "Today first": when the visible week contains today, scroll the day strip
  // so today is the first column after the gutter; otherwise centre on the
  // day the user navigated to. Only matters when the strip overflows (the
  // 3-day phone / 5-day tablet windows) — on the full-week desktop layout
  // there's no horizontal overflow so this is a no-op.
  const hasToday = days.some((d) => sameYMD(d, today));
  const targetDate = hasToday ? today : cursor;
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sc = scrollRef.current;
    if (!sc) return;
    if (sc.scrollWidth <= sc.clientWidth) {
      sc.scrollLeft = 0;
      return;
    }
    const target = sc.querySelector<HTMLElement>('[data-target="1"]');
    const gutter = sc.querySelector<HTMLElement>(".week-gutter");
    if (!target) return;
    const gutterW = gutter ? gutter.offsetWidth : 0;
    const left =
      sc.scrollLeft +
      (target.getBoundingClientRect().left - sc.getBoundingClientRect().left) -
      gutterW;
    sc.scrollTo({ left: Math.max(0, left), behavior: "auto" });
  }, [startKey]);

  return (
    <div className="week">
      <div className="week-scroll" ref={scrollRef}>
        <div className="week-grid">
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
