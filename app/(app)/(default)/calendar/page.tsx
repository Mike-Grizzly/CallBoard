import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { requireCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getOrCreateDefaultOrganization } from "@/lib/organization";
import { getUserProductions } from "@/features/productions/queries";
import { getCallsForUserInRange } from "@/features/calls/queries";
import { MonthGrid } from "./month-grid";
import { WeekView } from "./week-view";
import { DayView } from "./day-view";
import { AgendaView } from "./agenda-view";
import { ProductionFilter } from "./production-filter";
import {
  addDays,
  addMonths,
  endOfMonthGrid,
  endOfWeek,
  parseDate,
  parseView,
  startOfMonthGrid,
  startOfWeek,
  toDateStr,
  type CalendarView,
} from "./utils";

const VIEW_OPTIONS: { value: CalendarView; label: string }[] = [
  { value: "month", label: "Month" },
  { value: "week", label: "Week" },
  { value: "day", label: "Day" },
  { value: "agenda", label: "Agenda" },
];

const AGENDA_LOOKAHEAD_DAYS = 30;

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{
    view?: string;
    date?: string;
    productions?: string;
  }>;
}) {
  const params = await searchParams;
  const user = await requireCurrentUser();
  const org = await getOrCreateDefaultOrganization();

  const view = parseView(params.view);
  const anchorDate = parseDate(params.date);
  const manageAll = can(user.role, "productions:manage");

  const userProductions = await getUserProductions(user.id);

  if (userProductions.length === 0) {
    return <EmptyState />;
  }

  let rangeStart: Date;
  let rangeEnd: Date;
  if (view === "month") {
    rangeStart = startOfMonthGrid(anchorDate);
    rangeEnd = endOfMonthGrid(anchorDate);
  } else if (view === "week") {
    rangeStart = startOfWeek(anchorDate);
    rangeEnd = endOfWeek(anchorDate);
  } else if (view === "day") {
    rangeStart = anchorDate;
    rangeEnd = anchorDate;
  } else {
    rangeStart = anchorDate;
    rangeEnd = addDays(anchorDate, AGENDA_LOOKAHEAD_DAYS);
  }

  const productionIds = new Set(userProductions.map((p) => p.id));
  const selected: Set<string> = params.productions
    ? new Set(
        params.productions.split(",").filter((id) => productionIds.has(id)),
      )
    : new Set(productionIds);

  const allCalls = await getCallsForUserInRange({
    userId: user.id,
    organizationId: org.id,
    startDate: toDateStr(rangeStart),
    endDate: toDateStr(rangeEnd),
    manageAll,
  });

  const filteredCalls =
    selected.size === productionIds.size
      ? allCalls
      : allCalls.filter((c) => selected.has(c.productionId));

  const now = new Date();
  const today = toDateStr(now);
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  const headerLabel =
    view === "month"
      ? anchorDate.toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        })
      : view === "week"
        ? `${startOfWeek(anchorDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${endOfWeek(anchorDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
        : view === "day"
          ? anchorDate.toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })
          : `Next ${AGENDA_LOOKAHEAD_DAYS} days`;

  const navStep = (dir: -1 | 1): Date => {
    if (view === "month") return addMonths(anchorDate, dir);
    if (view === "week") return addDays(anchorDate, dir * 7);
    if (view === "day") return addDays(anchorDate, dir);
    return addDays(anchorDate, dir * 7);
  };

  const buildHref = (overrides: { view?: CalendarView; date?: string }) => {
    const sp = new URLSearchParams();
    sp.set("view", overrides.view ?? view);
    const targetDate = overrides.date ?? toDateStr(anchorDate);
    if (
      targetDate !== toDateStr(new Date(new Date().setHours(0, 0, 0, 0)))
    ) {
      sp.set("date", targetDate);
    }
    if (params.productions) sp.set("productions", params.productions);
    return `/calendar?${sp.toString()}`;
  };

  return (
    <div className="page-narrow">
      <header className="cal-toolbar">
        <div className="cal-toolbar-left">
          <div className="cal-title-row">
            <h1 className="cal-title">Calendar</h1>
            <span className="cal-subtitle">{headerLabel}</span>
          </div>
        </div>

        <div className="cal-toolbar-right">
          <div className="cal-nav">
            <Link
              href={buildHref({ date: toDateStr(navStep(-1)) })}
              className="btn btn-icon"
              aria-label={`Previous ${view}`}
            >
              <Icon name="ChevronLeft" className="ico" />
            </Link>
            <Link
              href={buildHref({ date: toDateStr(new Date()) })}
              className="btn"
            >
              Today
            </Link>
            <Link
              href={buildHref({ date: toDateStr(navStep(1)) })}
              className="btn btn-icon"
              aria-label={`Next ${view}`}
            >
              <Icon name="ChevronRight" className="ico" />
            </Link>
          </div>

          <div className="cal-views" role="tablist" aria-label="Calendar view">
            {VIEW_OPTIONS.map((v) => (
              <Link
                key={v.value}
                href={buildHref({ view: v.value })}
                className="cal-view"
                data-active={view === v.value ? "1" : "0"}
                role="tab"
                aria-selected={view === v.value}
              >
                {v.label}
              </Link>
            ))}
          </div>
        </div>
      </header>

      {userProductions.length > 1 && (
        <div style={{ marginBottom: 14 }}>
          <ProductionFilter
            productions={userProductions.map((p) => ({
              id: p.id,
              title: p.title,
              color: p.color,
            }))}
            selected={selected}
          />
        </div>
      )}

      {view === "month" && (
        <MonthGrid
          monthDate={anchorDate}
          calls={filteredCalls}
          today={today}
          currentTime={currentTime}
        />
      )}
      {view === "week" && (
        <WeekView
          anchorDate={anchorDate}
          calls={filteredCalls}
          today={today}
          currentTime={currentTime}
        />
      )}
      {view === "day" && (
        <DayView
          date={anchorDate}
          calls={filteredCalls}
          today={today}
          currentTime={currentTime}
        />
      )}
      {view === "agenda" && (
        <AgendaView
          calls={filteredCalls}
          today={today}
          currentTime={currentTime}
        />
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="page-narrow">
      <div className="cal-empty">
        <Icon name="CalendarDays" className="ico" />
        <h1 className="h-section" style={{ fontSize: 20 }}>
          Your calendar is empty
        </h1>
        <p
          style={{
            marginTop: 8,
            fontSize: 13,
            color: "var(--ink-3)",
          }}
        >
          You aren&apos;t a member of any productions yet. Once a stage
          manager adds you, calls will show up here.
        </p>
        <Link
          href="/productions"
          className="btn"
          style={{ marginTop: 16, display: "inline-flex" }}
        >
          Browse productions
        </Link>
      </div>
    </div>
  );
}
