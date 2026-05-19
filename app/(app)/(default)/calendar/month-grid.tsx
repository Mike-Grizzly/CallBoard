import Link from "next/link";
import type { UserCalendarCall } from "@/features/calls/queries";
import { resolveProductionColorToken } from "@/features/productions/constants";
import {
  callStatus,
  formatDisplayTime,
  groupCallsByDate,
  toDateStr,
  startOfMonthGrid,
  endOfMonthGrid,
  addDays,
} from "./utils";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function MonthGrid({
  monthDate,
  calls,
  today,
  currentTime,
}: {
  monthDate: Date;
  calls: UserCalendarCall[];
  today: string;
  currentTime: string;
}) {
  const start = startOfMonthGrid(monthDate);
  const end = endOfMonthGrid(monthDate);
  const totalDays =
    Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1;

  const cells: Date[] = [];
  for (let i = 0; i < totalDays; i++) cells.push(addDays(start, i));

  const byDate = groupCallsByDate(calls);
  const currentMonth = monthDate.getMonth();

  return (
    <div className="cal-month">
      <div className="cal-month-head">
        {WEEKDAYS.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="cal-month-grid">
        {cells.map((cell) => {
          const dateStr = toDateStr(cell);
          const dayCalls = byDate.get(dateStr) ?? [];
          const isToday = dateStr === today;
          const isPast = dateStr < today;
          const inMonth = cell.getMonth() === currentMonth;

          const cls = [
            "cal-day-cell",
            !inMonth && "cal-day-cell--out",
            inMonth && isPast && "cal-day-cell--past",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <div key={dateStr} className={cls}>
              <div className="cal-day-num-row">
                <span
                  className={`cal-day-num${isToday ? " cal-day-num--today" : ""}`}
                >
                  {cell.getDate()}
                </span>
              </div>
              {dayCalls.map((call) => (
                <MonthChip
                  key={call.id}
                  call={call}
                  today={today}
                  currentTime={currentTime}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MonthChip({
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
  const timeDisplay = timeLabel
    ? endLabel
      ? `${timeLabel}–${endLabel}`
      : timeLabel
    : "Call";

  return (
    <Link
      href={`/productions/${call.productionSlug}/calls`}
      className={`cal-chip${status === "live" ? " cal-chip--live" : ""}`}
      data-c={token}
      title={`${call.productionTitle}${call.focus ? " — " + call.focus : ""}`}
    >
      <span className="cal-chip-time">
        {status === "live" && <span className="cal-live-dot" aria-hidden />}
        {timeDisplay}
      </span>
      <span className="cal-chip-prod">{call.productionTitle}</span>
      {call.focus && <span className="cal-chip-focus">{call.focus}</span>}
    </Link>
  );
}
