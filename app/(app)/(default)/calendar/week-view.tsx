import Link from "next/link";
import type { UserCalendarCall } from "@/features/calls/queries";
import {
  colorVarForToken,
  resolveProductionColorToken,
} from "@/features/productions/constants";
import {
  callStatus,
  formatDisplayTime,
  groupCallsByDate,
  toDateStr,
  startOfWeek,
  addDays,
} from "./utils";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function WeekView({
  anchorDate,
  calls,
  today,
  currentTime,
}: {
  anchorDate: Date;
  calls: UserCalendarCall[];
  today: string;
  currentTime: string;
}) {
  const start = startOfWeek(anchorDate);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const byDate = groupCallsByDate(calls);

  return (
    <div className="cal-week">
      <div className="cal-week-head">
        {days.map((d, i) => {
          const dateStr = toDateStr(d);
          const isToday = dateStr === today;
          return (
            <div key={dateStr}>
              <div className="cal-week-day-label">{WEEKDAYS[i]}</div>
              <div
                className={`cal-week-day-num${isToday ? " cal-week-day-num--today" : ""}`}
              >
                {d.getDate()}
              </div>
            </div>
          );
        })}
      </div>
      <div className="cal-week-grid">
        {days.map((d) => {
          const dateStr = toDateStr(d);
          const dayCalls = byDate.get(dateStr) ?? [];
          const isPast = dateStr < today;
          return (
            <div
              key={dateStr}
              className={`cal-week-col${isPast ? " cal-week-col--past" : ""}`}
            >
              {dayCalls.length === 0 ? (
                <div className="cal-week-empty">No calls</div>
              ) : (
                dayCalls.map((call) => (
                  <WeekCard
                    key={call.id}
                    call={call}
                    today={today}
                    currentTime={currentTime}
                  />
                ))
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeekCard({
  call,
  today,
  currentTime,
}: {
  call: UserCalendarCall;
  today: string;
  currentTime: string;
}) {
  const status = callStatus(call, today, currentTime);
  const token = resolveProductionColorToken({
    id: call.productionId,
    color: call.productionColor,
  });
  const timeLabel = formatDisplayTime(call.callTime);
  const endLabel = formatDisplayTime(call.endTime);

  return (
    <Link
      href={`/productions/${call.productionSlug}/calls`}
      className="cal-card"
      data-c={token}
    >
      <div className="cal-card-prod">
        <span
          className="prod-dot"
          style={{ background: colorVarForToken(token) }}
          aria-hidden
        />
        <span>{call.productionTitle}</span>
      </div>
      {timeLabel && (
        <div className="cal-card-time">
          {status === "live" && <span className="cal-live-dot" aria-hidden />}
          <span>
            {timeLabel}
            {endLabel && ` – ${endLabel}`}
          </span>
        </div>
      )}
      {call.focus && <div className="cal-card-focus">{call.focus}</div>}
      {!call.focus && call.location && (
        <div className="cal-card-meta">{call.location}</div>
      )}
    </Link>
  );
}
