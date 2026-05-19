import Link from "next/link";
import type { UserCalendarCall } from "@/features/calls/queries";
import {
  colorVarForToken,
  resolveProductionColorToken,
} from "@/features/productions/constants";
import { callStatus, formatDisplayTime, groupCallsByDate } from "./utils";

export function AgendaView({
  calls,
  today,
  currentTime,
}: {
  calls: UserCalendarCall[];
  today: string;
  currentTime: string;
}) {
  if (calls.length === 0) {
    return (
      <div className="cal-agenda">
        <div className="cal-agenda-empty">
          No calls in this window.
        </div>
      </div>
    );
  }

  const byDate = groupCallsByDate(calls);
  const dates = Array.from(byDate.keys()).sort();

  return (
    <div className="cal-agenda">
      {dates.map((dateStr) => {
        const dayCalls = byDate.get(dateStr) ?? [];
        dayCalls.sort((a, b) => (a.callTime ?? "").localeCompare(b.callTime ?? ""));
        const d = new Date(`${dateStr}T00:00:00`);
        const isToday = dateStr === today;
        const isPast = dateStr < today;

        return (
          <div
            key={dateStr}
            className={`cal-agenda-section${isToday ? " cal-agenda-date--today" : ""}`}
          >
            <div className="cal-agenda-date">
              <div className="cal-agenda-date-day">{d.getDate()}</div>
              <div className="cal-agenda-date-weekday">
                {d.toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                })}
              </div>
            </div>
            <div className="cal-agenda-rows">
              {dayCalls.map((call) => {
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
                    className={`cal-agenda-row${rowPast ? " cal-agenda-row--past" : ""}`}
                  >
                    <div className="cal-agenda-time">
                      {timeLabel ? (
                        <>
                          {timeLabel}
                          {endLabel && (
                            <>
                              <br />
                              <span style={{ color: "var(--ink-4)" }}>
                                – {endLabel}
                              </span>
                            </>
                          )}
                        </>
                      ) : (
                        <span style={{ color: "var(--ink-4)" }}>—</span>
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
                      <div className="cal-agenda-focus">
                        {call.focus ?? (
                          <span style={{ color: "var(--ink-3)", fontStyle: "italic" }}>
                            No focus set
                          </span>
                        )}
                      </div>
                      {call.location && (
                        <div className="cal-agenda-meta">{call.location}</div>
                      )}
                    </div>

                    <div>
                      {status === "live" && (
                        <span className="pill" data-c="accent">
                          <span className="cal-live-dot" aria-hidden />
                          Live
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
