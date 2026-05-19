import Link from "next/link";
import type { UserCalendarCall } from "@/features/calls/queries";
import {
  colorVarForToken,
  resolveProductionColorToken,
} from "@/features/productions/constants";
import { callStatus, formatDisplayTime, toDateStr } from "./utils";

export function DayView({
  date,
  calls,
  today,
  currentTime,
}: {
  date: Date;
  calls: UserCalendarCall[];
  today: string;
  currentTime: string;
}) {
  const dateStr = toDateStr(date);
  const dayCalls = calls
    .filter((c) => c.callDate === dateStr)
    .sort((a, b) => (a.callTime ?? "").localeCompare(b.callTime ?? ""));

  const isToday = dateStr === today;
  const weekday = date.toLocaleDateString("en-US", { weekday: "long" });
  const dayLabel = date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const isPast = dateStr < today;

  return (
    <div className="cal-day">
      <aside className="cal-day-rail">
        <div className="cal-day-weekday">{isToday ? "Today" : weekday}</div>
        <div className="cal-day-date">{dayLabel}</div>
        <div className="cal-day-summary">
          {dayCalls.length === 0 ? (
            <>No calls scheduled.</>
          ) : (
            <>
              <strong>{dayCalls.length}</strong> call
              {dayCalls.length === 1 ? "" : "s"} across{" "}
              <strong>
                {new Set(dayCalls.map((c) => c.productionId)).size}
              </strong>{" "}
              production
              {new Set(dayCalls.map((c) => c.productionId)).size === 1
                ? ""
                : "s"}
              .
            </>
          )}
        </div>
      </aside>

      <div className="cal-day-body">
        {dayCalls.length === 0 ? (
          <div className="cal-day-empty">
            Nothing on the schedule for this day.
          </div>
        ) : (
          dayCalls.map((call) => {
            const token = resolveProductionColorToken({
              id: call.productionId,
              color: call.productionColor,
            });
            const status = callStatus(call, today, currentTime);
            const timeLabel = formatDisplayTime(call.callTime);
            const endLabel = formatDisplayTime(call.endTime);
            const rowPast = isPast || status === "past";

            return (
              <Link
                key={call.id}
                href={`/productions/${call.productionSlug}/calls`}
                className={`cal-day-row${rowPast ? " cal-day-row--past" : ""}`}
              >
                <div>
                  {timeLabel ? (
                    <>
                      <div className="cal-day-time-strong">{timeLabel}</div>
                      {endLabel && (
                        <div className="cal-day-time">until {endLabel}</div>
                      )}
                      {status === "live" && (
                        <div
                          className="cal-day-time"
                          style={{ color: "var(--accent)", marginTop: 4 }}
                        >
                          <span
                            className="cal-live-dot"
                            style={{ display: "inline-block", marginRight: 4 }}
                            aria-hidden
                          />
                          Live now
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="cal-day-time">All day</div>
                  )}
                </div>

                <div>
                  <div className="cal-card-prod">
                    <span
                      className="prod-dot"
                      style={{ background: colorVarForToken(token) }}
                      aria-hidden
                    />
                    <span>{call.productionTitle}</span>
                  </div>
                  {call.focus && (
                    <div
                      style={{
                        marginTop: 4,
                        fontSize: 14,
                        fontWeight: 500,
                        color: "var(--ink)",
                      }}
                    >
                      {call.focus}
                    </div>
                  )}
                  {call.location && (
                    <div className="cal-card-meta">{call.location}</div>
                  )}
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
