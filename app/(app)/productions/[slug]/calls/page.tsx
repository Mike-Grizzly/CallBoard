import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { requireCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getOrCreateDefaultOrganization } from "@/lib/organization";
import { getProductionBySlug } from "@/features/productions/queries";
import { getProductionMembership } from "@/features/members/queries";
import { getAllCallsForProduction } from "@/features/calls/queries";
import type { Call } from "@/db/schema";

// ── helpers ────────────────────────────────────────────────────────────────

function parseMonth(raw: string | undefined): { year: number; month: number } {
  if (raw && /^\d{4}-\d{2}$/.test(raw)) {
    const [y, m] = raw.split("-").map(Number);
    if (y >= 2000 && y <= 2100 && m >= 1 && m <= 12) {
      return { year: y, month: m };
    }
  }
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

function prevMonthParam(year: number, month: number): string {
  const d = new Date(year, month - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function nextMonthParam(year: number, month: number): string {
  const d = new Date(year, month, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function buildCalendarGrid(year: number, month: number) {
  const firstDay = new Date(year, month - 1, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function formatDisplayTime(stored: string | null | undefined): string | null {
  if (!stored) return null;
  const m = stored.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return stored;
  const h = parseInt(m[1]);
  const mins = m[2];
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${mins} ${period}`;
}

function callStatus(
  call: Call,
  today: string,
  currentTime: string,
): "live" | "upcoming" | "past" {
  if (call.callDate < today) return "past";
  if (call.callDate > today) return "upcoming";
  // same day
  if (call.endTime && call.endTime <= currentTime) return "past";
  if (call.callTime && call.callTime > currentTime) return "upcoming";
  return "live";
}

// ── page ──────────────────────────────────────────────────────────────────

export default async function CallsCalendarPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ month?: string }>;
}) {
  const [{ slug }, { month: monthParam }] = await Promise.all([
    params,
    searchParams,
  ]);

  const user = await requireCurrentUser();
  const org = await getOrCreateDefaultOrganization();
  const production = await getProductionBySlug(org.id, slug);
  if (!production) notFound();

  const canManage = can(user.role, "productions:manage");
  if (!canManage) {
    const membership = await getProductionMembership(user.id, production.id);
    if (!membership) redirect("/productions");
  }

  const canSchedule = can(user.role, "reports:create");

  const { year, month } = parseMonth(monthParam);
  const allCalls = await getAllCallsForProduction(production.id);

  // Index calls by date string for O(1) lookup
  const callsByDate = new Map<string, Call[]>();
  for (const call of allCalls) {
    const existing = callsByDate.get(call.callDate) ?? [];
    existing.push(call);
    callsByDate.set(call.callDate, existing);
  }

  const cells = buildCalendarGrid(year, month);
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  const monthLabel = new Date(year, month - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Count upcoming calls for the header summary
  const upcomingCount = allCalls.filter(
    (c) => c.callDate >= todayStr && c.status === "scheduled",
  ).length;

  return (
    <div className="mx-auto max-w-5xl">
      {/* Breadcrumb + header */}
      <div className="mb-6">
        <nav className="mb-3 flex items-center gap-1.5 text-sm text-[color:var(--muted-foreground)]">
          <Link
            href="/productions"
            className="hover:text-[color:var(--foreground)] transition-colors"
          >
            Productions
          </Link>
          <span>/</span>
          <Link
            href={`/productions/${slug}`}
            className="hover:text-[color:var(--foreground)] transition-colors"
          >
            {production.title}
          </Link>
          <span>/</span>
          <span className="text-[color:var(--foreground)]">Calls</span>
        </nav>

        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Call Schedule</h1>
            <p className="mt-0.5 text-sm text-[color:var(--muted-foreground)]">
              {upcomingCount > 0
                ? `${upcomingCount} upcoming call${upcomingCount !== 1 ? "s" : ""} scheduled`
                : "No upcoming calls scheduled"}
            </p>
          </div>
          {canSchedule && (
            <Link
              href={`/productions/${slug}/calls/new`}
              className="inline-flex items-center gap-1.5 rounded-md bg-[color:var(--primary)] px-3 py-2 text-sm font-medium text-[color:var(--primary-foreground)] hover:opacity-90 transition-opacity"
            >
              <Plus className="h-4 w-4" />
              Schedule call
            </Link>
          )}
        </div>
      </div>

      {/* Calendar card */}
      <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] overflow-hidden">
        {/* Month nav */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[color:var(--border)]">
          <Link
            href={`/productions/${slug}/calls?month=${prevMonthParam(year, month)}`}
            className="flex items-center justify-center h-8 w-8 rounded-md hover:bg-[color:var(--accent)] transition-colors text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <h2 className="text-base font-semibold">{monthLabel}</h2>
          <Link
            href={`/productions/${slug}/calls?month=${nextMonthParam(year, month)}`}
            className="flex items-center justify-center h-8 w-8 rounded-md hover:bg-[color:var(--accent)] transition-colors text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]"
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Weekday headers */}
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

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {cells.map((day, idx) => {
            if (day === null) {
              return (
                <div
                  key={`empty-${idx}`}
                  className="min-h-[100px] border-b border-r border-[color:var(--border)] bg-[color:var(--muted)]/30 last:border-r-0 [&:nth-child(7n)]:border-r-0"
                />
              );
            }

            const dateStr = toDateStr(year, month, day);
            const isToday = dateStr === todayStr;
            const isPast = dateStr < todayStr;
            const dayCalls = callsByDate.get(dateStr) ?? [];

            return (
              <div
                key={dateStr}
                className={`min-h-[100px] border-b border-r border-[color:var(--border)] p-2 flex flex-col gap-1 relative group [&:nth-child(7n)]:border-r-0 ${
                  isPast ? "opacity-60" : ""
                }`}
              >
                {/* Day number */}
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                      isToday
                        ? "bg-[#c4572a] text-white"
                        : "text-[color:var(--foreground)]"
                    }`}
                  >
                    {day}
                  </span>
                  {/* Quick-add button on hover (SM only) */}
                  {canSchedule && !isPast && (
                    <Link
                      href={`/productions/${slug}/calls/new?date=${dateStr}`}
                      className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center h-5 w-5 rounded text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] hover:bg-[color:var(--accent)]"
                      title={`Schedule call for ${dateStr}`}
                    >
                      <Plus className="h-3 w-3" />
                    </Link>
                  )}
                </div>

                {/* Call chips */}
                {dayCalls.map((call) => {
                  const status = callStatus(call, todayStr, currentTime);
                  const timeLabel = formatDisplayTime(call.callTime);
                  const endLabel = formatDisplayTime(call.endTime);
                  const timeDisplay = timeLabel
                    ? endLabel
                      ? `${timeLabel}–${endLabel}`
                      : timeLabel
                    : null;

                  return (
                    <Link
                      key={call.id}
                      href={
                        canSchedule
                          ? `/productions/${slug}/calls/${call.id}/edit`
                          : "#"
                      }
                      className={`block rounded px-1.5 py-1 text-xs leading-tight transition-opacity hover:opacity-80 ${
                        status === "live"
                          ? "bg-[#c4572a] text-white"
                          : status === "past"
                            ? "bg-[color:var(--muted)] text-[color:var(--muted-foreground)]"
                            : "bg-[color:var(--primary)]/10 text-[color:var(--primary)] border border-[color:var(--primary)]/20"
                      }`}
                    >
                      {status === "live" && (
                        <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-white animate-pulse align-middle" />
                      )}
                      <span className="font-medium">
                        {timeDisplay ?? "Call"}
                      </span>
                      {call.focus && (
                        <span className="block truncate opacity-80">
                          {call.focus}
                        </span>
                      )}
                      {!call.focus && call.location && (
                        <span className="block truncate opacity-80">
                          {call.location}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-[color:var(--muted-foreground)]">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded bg-[color:var(--primary)]/10 border border-[color:var(--primary)]/20" />
          Scheduled
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded bg-[#c4572a]" />
          Live now
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded bg-[color:var(--muted)]" />
          Past
        </span>
        {canSchedule && (
          <span className="ml-auto">
            Click a date to schedule · click a call to edit
          </span>
        )}
      </div>

      {/* Upcoming list view */}
      {allCalls.filter((c) => c.callDate >= todayStr).length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-base font-semibold">Upcoming calls</h2>
          <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] divide-y divide-[color:var(--border)]">
            {allCalls
              .filter((c) => c.callDate >= todayStr)
              .map((call) => {
                const status = callStatus(call, todayStr, currentTime);
                const d = new Date(`${call.callDate}T00:00:00`);
                const dateLabel = d.toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                });
                const timeLabel = formatDisplayTime(call.callTime);
                const endLabel = formatDisplayTime(call.endTime);

                return (
                  <div
                    key={call.id}
                    className="flex items-start gap-4 px-4 py-3"
                  >
                    <div className="shrink-0 w-28">
                      <p className="text-sm font-medium text-[color:var(--foreground)]">
                        {dateLabel}
                      </p>
                      {timeLabel && (
                        <p className="text-xs text-[color:var(--muted-foreground)]">
                          {timeLabel}
                          {endLabel && ` – ${endLabel}`}
                        </p>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      {call.focus && (
                        <p className="text-sm font-medium truncate">
                          {call.focus}
                        </p>
                      )}
                      {call.location && (
                        <p className="text-xs text-[color:var(--muted-foreground)] truncate">
                          {call.location}
                        </p>
                      )}
                      {!call.focus && !call.location && (
                        <p className="text-sm text-[color:var(--muted-foreground)] italic">
                          No details yet
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      {status === "live" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#c4572a] px-2 py-0.5 text-xs font-bold text-white uppercase tracking-wide">
                          <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                          Live
                        </span>
                      )}
                      {canSchedule && (
                        <Link
                          href={`/productions/${slug}/calls/${call.id}/edit`}
                          className="text-xs text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] transition-colors"
                        >
                          Edit
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
