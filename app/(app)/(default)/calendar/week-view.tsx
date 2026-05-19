import Link from "next/link";
import type { UserCalendarCall } from "@/features/calls/queries";
import { resolveProductionColor } from "@/features/productions/constants";
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
    <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] overflow-hidden">
      <div className="grid grid-cols-7 border-b border-[color:var(--border)]">
        {days.map((d, i) => {
          const dateStr = toDateStr(d);
          const isToday = dateStr === today;
          return (
            <div
              key={dateStr}
              className="px-2 py-2 text-center border-r border-[color:var(--border)] last:border-r-0"
            >
              <div className="text-xs font-semibold uppercase tracking-wide text-[color:var(--muted-foreground)]">
                {WEEKDAYS[i]}
              </div>
              <div
                className={`mt-1 inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${
                  isToday ? "bg-[#c4572a] text-white" : ""
                }`}
              >
                {d.getDate()}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-7 min-h-[400px]">
        {days.map((d) => {
          const dateStr = toDateStr(d);
          const dayCalls = byDate.get(dateStr) ?? [];
          const isPast = dateStr < today;

          return (
            <div
              key={dateStr}
              className={`border-r border-[color:var(--border)] last:border-r-0 p-2 flex flex-col gap-2 ${
                isPast ? "opacity-60" : ""
              }`}
            >
              {dayCalls.length === 0 ? (
                <div className="text-xs text-[color:var(--muted-foreground)] italic px-1">
                  No calls
                </div>
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
  const color = resolveProductionColor({
    id: call.productionId,
    color: call.productionColor,
  });
  const timeLabel = formatDisplayTime(call.callTime);
  const endLabel = formatDisplayTime(call.endTime);

  return (
    <Link
      href={`/productions/${call.productionSlug}/calls`}
      className={`block rounded-md border border-[color:var(--border)] bg-[color:var(--card)] p-2 transition-colors hover:bg-[color:var(--muted)] ${
        status === "live" ? "ring-1 ring-[#c4572a]" : ""
      }`}
    >
      <div className="flex items-center gap-1.5">
        <span
          className="h-2 w-2 shrink-0 rounded-full"
          style={{ background: color }}
          aria-hidden
        />
        <span className="text-[10px] font-semibold uppercase tracking-wide text-[color:var(--muted-foreground)] truncate">
          {call.productionTitle}
        </span>
      </div>
      {timeLabel && (
        <div className="mt-1 text-xs font-medium">
          {timeLabel}
          {endLabel && ` – ${endLabel}`}
          {status === "live" && (
            <span className="ml-1 inline-flex items-center gap-0.5 text-[10px] font-bold uppercase tracking-wide text-[#c4572a]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#c4572a] animate-pulse" />
              Live
            </span>
          )}
        </div>
      )}
      {call.focus && (
        <div className="mt-0.5 text-xs text-[color:var(--muted-foreground)] line-clamp-2">
          {call.focus}
        </div>
      )}
      {!call.focus && call.location && (
        <div className="mt-0.5 text-xs text-[color:var(--muted-foreground)] truncate">
          {call.location}
        </div>
      )}
    </Link>
  );
}
