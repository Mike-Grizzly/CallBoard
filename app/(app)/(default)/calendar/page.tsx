import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { requireCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getOrCreateDefaultOrganization } from "@/lib/organization";
import { getUserProductions } from "@/features/productions/queries";
import { getCallsForUserInRange } from "@/features/calls/queries";
import { MonthGrid } from "./month-grid";
import { WeekView } from "./week-view";
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
} from "./utils";

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

  // Determine date window based on view
  const rangeStart =
    view === "month" ? startOfMonthGrid(anchorDate) : startOfWeek(anchorDate);
  const rangeEnd =
    view === "month" ? endOfMonthGrid(anchorDate) : endOfWeek(anchorDate);

  // Parse production filter (default: show all)
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
      : `${startOfWeek(anchorDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${endOfWeek(anchorDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;

  const prevAnchor = view === "month" ? addMonths(anchorDate, -1) : addDays(anchorDate, -7);
  const nextAnchor = view === "month" ? addMonths(anchorDate, 1) : addDays(anchorDate, 7);

  const buildHref = (overrides: { view?: string; date?: string }) => {
    const sp = new URLSearchParams();
    sp.set("view", overrides.view ?? view);
    if (overrides.date) sp.set("date", overrides.date);
    if (params.productions) sp.set("productions", params.productions);
    return `/calendar?${sp.toString()}`;
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
          <p className="mt-0.5 text-sm text-[color:var(--muted-foreground)]">
            {manageAll
              ? "All scheduled calls across the organization."
              : `Calls across your ${userProductions.length} production${userProductions.length === 1 ? "" : "s"}.`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-md border border-[color:var(--border)] overflow-hidden">
            <Link
              href={buildHref({ view: "month" })}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                view === "month"
                  ? "bg-[color:var(--foreground)] text-[color:var(--background)]"
                  : "text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]"
              }`}
            >
              Month
            </Link>
            <Link
              href={buildHref({ view: "week" })}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                view === "week"
                  ? "bg-[color:var(--foreground)] text-[color:var(--background)]"
                  : "text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]"
              }`}
            >
              Week
            </Link>
          </div>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link
            href={buildHref({ date: toDateStr(prevAnchor) })}
            className="flex items-center justify-center h-8 w-8 rounded-md border border-[color:var(--border)] hover:bg-[color:var(--muted)] transition-colors text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]"
            aria-label={`Previous ${view}`}
          >
            <Icon name="ChevronLeft" className="h-4 w-4" />
          </Link>
          <h2 className="text-base font-semibold min-w-[180px] text-center">
            {headerLabel}
          </h2>
          <Link
            href={buildHref({ date: toDateStr(nextAnchor) })}
            className="flex items-center justify-center h-8 w-8 rounded-md border border-[color:var(--border)] hover:bg-[color:var(--muted)] transition-colors text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]"
            aria-label={`Next ${view}`}
          >
            <Icon name="ChevronRight" className="h-4 w-4" />
          </Link>
          <Link
            href={buildHref({ date: toDateStr(new Date()) })}
            className="ml-2 rounded-md border border-[color:var(--border)] px-3 py-1.5 text-xs font-medium hover:bg-[color:var(--muted)] transition-colors"
          >
            Today
          </Link>
        </div>

        <ProductionFilter
          productions={userProductions.map((p) => ({
            id: p.id,
            title: p.title,
            color: p.color,
          }))}
          selected={selected}
        />
      </div>

      {view === "month" ? (
        <MonthGrid
          monthDate={anchorDate}
          calls={filteredCalls}
          today={today}
          currentTime={currentTime}
        />
      ) : (
        <WeekView
          anchorDate={anchorDate}
          calls={filteredCalls}
          today={today}
          currentTime={currentTime}
        />
      )}

      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-[color:var(--muted-foreground)]">
        <span>Colored stripe = production · click a call to open its schedule</span>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] p-12 text-center">
        <Icon
          name="CalendarDays"
          className="mx-auto mb-3 h-10 w-10 text-[color:var(--muted-foreground)]"
        />
        <h1 className="text-lg font-semibold">Your calendar is empty</h1>
        <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
          You aren&apos;t a member of any productions yet. Once a stage manager
          adds you, calls will show up here.
        </p>
        <Link
          href="/productions"
          className="mt-4 inline-flex rounded-md border border-[color:var(--border)] px-3 py-1.5 text-sm font-medium hover:bg-[color:var(--muted)] transition-colors"
        >
          Browse productions
        </Link>
      </div>
    </div>
  );
}
