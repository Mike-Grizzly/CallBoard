import Link from "next/link";

export interface NextCallSummary {
  productionTitle: string;
  productionSlug: string;
  dateLabel: string;
  isToday: boolean;
  isTomorrow: boolean;
  callTime: string | null;
  endTime: string | null;
  location: string | null;
  focus: string | null;
}

/**
 * Mobile-only Today/Dashboard hero. Renders at phone widths (<=720px)
 * inside the existing dashboard page; the desktop hero + "Upcoming
 * rehearsals & calls" grid are hidden in the same media query (see
 * `.mt-today` rules in globals.css). All data is pre-computed by the
 * parent server component.
 */
export function MobileTodayHero({
  greeting,
  firstName,
  todayLabel,
  productionsCount,
  unreadMentionCount,
  pinnedCount,
  nextCall,
}: {
  greeting: string;
  firstName: string;
  todayLabel: string;
  productionsCount: number;
  unreadMentionCount: number;
  pinnedCount: number;
  nextCall: NextCallSummary | null;
}) {
  const callEyebrow = nextCall
    ? nextCall.isToday
      ? "Today's call"
      : nextCall.isTomorrow
        ? "Tomorrow's call"
        : `Next call · ${nextCall.dateLabel}`
    : "No upcoming call";

  return (
    <div className="mt-today">
      <div className="mt-greeting">
        <div className="mt-eyebrow">{todayLabel}</div>
        <h1 className="mt-greeting-title">
          {greeting}
          {firstName ? (
            <>
              , <em>{firstName}</em>
            </>
          ) : null}
          .
        </h1>
        <p className="mt-greeting-sub">
          {productionsCount > 0 ? (
            <>
              You&apos;re on <b>{productionsCount}</b> production
              {productionsCount !== 1 ? "s" : ""}.
              {nextCall?.callTime && nextCall.isToday ? (
                <>
                  {" "}
                  Next up tonight at <b>{nextCall.callTime}</b>.
                </>
              ) : null}
            </>
          ) : (
            "No productions yet — open the More tab to get started."
          )}
        </p>
      </div>

      {nextCall ? (
        <div className="mt-call-card">
          <div className="mt-call-body">
            <div className="mt-call-head">
              <span className="mt-call-eyebrow">{callEyebrow}</span>
            </div>
            {nextCall.callTime ? (
              <div className="mt-call-time">
                <span className="mt-call-time-big">{nextCall.callTime}</span>
                {nextCall.endTime ? (
                  <span className="mt-call-time-end">
                    – {nextCall.endTime}
                  </span>
                ) : null}
              </div>
            ) : null}
            <div className="mt-call-focus">
              {nextCall.focus ?? nextCall.productionTitle}
            </div>
            <div className="mt-call-pills">
              <span className="mt-pill" data-c="accent">
                {nextCall.productionTitle}
              </span>
              {nextCall.location ? (
                <span className="mt-pill">{nextCall.location}</span>
              ) : null}
            </div>
          </div>
          <div className="mt-call-foot">
            <Link
              href={`/productions/${nextCall.productionSlug}`}
              className="mt-call-foot-btn"
            >
              Open production
            </Link>
          </div>
        </div>
      ) : productionsCount > 0 ? (
        <div className="mt-call-card">
          <div className="mt-call-empty">No upcoming calls scheduled.</div>
        </div>
      ) : null}

      <div className="mt-stats">
        <div className="mt-stat">
          <div className="mt-stat-h">Productions</div>
          <div className="mt-stat-big">{productionsCount}</div>
          <div className="mt-stat-sub">on your plate</div>
        </div>
        <div className="mt-stat">
          <div className="mt-stat-h">Mentions</div>
          <div className="mt-stat-big">{unreadMentionCount}</div>
          <div className="mt-stat-sub">unread</div>
        </div>
        <div className="mt-stat">
          <div className="mt-stat-h">Pinned</div>
          <div className="mt-stat-big">{pinnedCount}</div>
          <div className="mt-stat-sub">
            announcement{pinnedCount !== 1 ? "s" : ""}
          </div>
        </div>
        <div className="mt-stat">
          <div className="mt-stat-h">Next call</div>
          <div className="mt-stat-big">
            {nextCall ? nextCall.dateLabel : "—"}
          </div>
          <div className="mt-stat-sub">
            {nextCall?.callTime ?? "no upcoming"}
          </div>
        </div>
      </div>
    </div>
  );
}
