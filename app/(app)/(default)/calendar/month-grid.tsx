import Link from "next/link";
import type { UserCalendarCall } from "@/features/calls/queries";
import { resolveProductionColor } from "@/features/productions/constants";
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
    <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] overflow-hidden">
      <div className="grid grid-cols-7 border-b border-[color:var(--border)]">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="px-2 py-2 text-center text-xs font-semibold uppercase tracking-wide text-[color:var(--muted-foreground)]"
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((cell) => {
          const dateStr = toDateStr(cell);
          const dayCalls = byDate.get(dateStr) ?? [];
          const isToday = dateStr === today;
          const isPast = dateStr < today;
          const inMonth = cell.getMonth() === currentMonth;

          return (
            <div
              key={dateStr}
              className={`min-h-[110px] border-b border-r border-[color:var(--border)] p-2 flex flex-col gap-1 [&:nth-child(7n)]:border-r-0 ${
                !inMonth ? "bg-[color:var(--muted)]/30" : ""
              } ${isPast ? "opacity-60" : ""}`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                    isToday
                      ? "bg-[#c4572a] text-white"
                      : inMonth
                        ? "text-[color:var(--foreground)]"
                        : "text-[color:var(--muted-foreground)]"
                  }`}
                >
                  {cell.getDate()}
                </span>
              </div>

              {dayCalls.map((call) => (
                <CallChip
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

function CallChip({
  call,
  today,
  currentTime,
}: {
  call: UserCalendarCall;
  today: string;
  currentTime: string;
}) {
  const status = callStatus(call, today, currentTime);
  const color = resolveProductionColor({
    id: call.productionId,
    color: call.productionColor,
  });
  const timeLabel = formatDisplayTime(call.callTime);
  const endLabel = formatDisplayTime(call.endTime);
  const timeDisplay = timeLabel
    ? endLabel
      ? `${timeLabel}–${endLabel}`
      : timeLabel
    : null;

  return (
    <Link
      href={`/productions/${call.productionSlug}/calls`}
      className={`group/chip block rounded border-l-[3px] bg-[color:var(--muted)]/40 px-1.5 py-1 text-xs leading-tight transition-opacity hover:opacity-80 ${
        status === "live" ? "ring-1 ring-[#c4572a]" : ""
      }`}
      style={{ borderLeftColor: color }}
      title={`${call.productionTitle}${call.focus ? " — " + call.focus : ""}`}
    >
      <div className="flex items-center gap-1">
        {status === "live" && (
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#c4572a] animate-pulse" />
        )}
        <span className="font-medium truncate">{timeDisplay ?? "Call"}</span>
      </div>
      <span className="block truncate text-[10px] text-[color:var(--muted-foreground)] uppercase tracking-wide">
        {call.productionTitle}
      </span>
      {call.focus && <span className="block truncate opacity-80">{call.focus}</span>}
    </Link>
  );
}
