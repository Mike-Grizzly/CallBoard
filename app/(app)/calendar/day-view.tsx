"use client";

import type { CSSProperties } from "react";
import { Icon } from "@/components/ui/icon";
import {
  type CalEvent,
  DAY_END_HOUR,
  DAY_START_HOUR,
  HOUR_PX,
  MONTHS,
  WEEKDAYS,
  fmtTime,
  minToY,
  sameYMD,
  ymd,
} from "./utils";

export function DayView({
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
  const dayKey = ymd(cursor);
  const dayEvents = events
    .filter((e) => e.date === dayKey && !e.allDay)
    .sort((a, b) => a.time.localeCompare(b.time));
  const allDay = events.filter((e) => e.date === dayKey && e.allDay);
  const hours = Array.from(
    { length: DAY_END_HOUR - DAY_START_HOUR + 1 },
    (_, i) => DAY_START_HOUR + i,
  );
  const isToday = sameYMD(cursor, today);

  return (
    <div className="day">
      <div className="day-track">
        <div className="week-gutter">
          {hours.map((h) => (
            <div key={h} className="hour-label" style={{ height: HOUR_PX }}>
              {h === 12 ? "12 PM" : h > 12 ? `${h - 12} PM` : `${h} AM`}
            </div>
          ))}
        </div>
        <div
          className="day-col"
          style={{ height: HOUR_PX * (DAY_END_HOUR - DAY_START_HOUR + 1) }}
        >
          {hours.map((h) => (
            <div key={h} className="hour-line" style={{ height: HOUR_PX }} />
          ))}
          {isToday && <NowLine />}
          {dayEvents.map((e) => (
            <DayBlock key={e.id} event={e} onClick={() => onSelect(e)} />
          ))}
        </div>
      </div>

      <aside className="day-side">
        <div className="day-side-h">
          <div className="day-side-wd">{WEEKDAYS[cursor.getDay()]}</div>
          <div className="day-side-num">{cursor.getDate()}</div>
          <div className="day-side-mon">{MONTHS[cursor.getMonth()]}</div>
        </div>

        {allDay.length > 0 && (
          <div>
            <div className="cal-side-h">All-day</div>
            {allDay.map((e) => (
              <div
                key={e.id}
                className="day-side-event"
                onClick={() => onSelect(e)}
              >
                <Icon name="Clock" className="ico" width={12} height={12} />{" "}
                {e.title}
              </div>
            ))}
          </div>
        )}

        <div>
          <div className="cal-side-h">
            {dayEvents.length} event{dayEvents.length === 1 ? "" : "s"}
          </div>
          {dayEvents.length === 0 ? (
            <div
              style={{
                fontSize: 12,
                color: "var(--ink-4)",
                fontStyle: "italic",
              }}
            >
              No calls scheduled.
            </div>
          ) : (
            dayEvents.map((e) => (
              <button
                key={e.id}
                className="day-list-item"
                onClick={() => onSelect(e)}
              >
                <span
                  className="day-list-spine"
                  style={{ background: e.productionColorVar }}
                />
                <div>
                  <div className="day-list-time mono">{fmtTime(e.time)}</div>
                  <div className="day-list-title">{e.title}</div>
                  {e.loc && <div className="day-list-loc">{e.loc}</div>}
                </div>
              </button>
            ))
          )}
        </div>
      </aside>
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

function DayBlock({
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
