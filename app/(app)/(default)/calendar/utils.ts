import type { UserCalendarCall } from "@/features/calls/queries";

export type CalendarView = "month" | "week";

export function parseView(raw: string | undefined): CalendarView {
  return raw === "week" ? "week" : "month";
}

export function parseDate(raw: string | undefined): Date {
  if (raw && /^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [y, m, d] = raw.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    if (!isNaN(dt.getTime())) return dt;
  }
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function toDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

export function endOfWeek(date: Date): Date {
  const d = startOfWeek(date);
  d.setDate(d.getDate() + 6);
  return d;
}

export function startOfMonthGrid(date: Date): Date {
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  return startOfWeek(first);
}

export function endOfMonthGrid(date: Date): Date {
  const last = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return endOfWeek(last);
}

export function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

export function addMonths(date: Date, n: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + n, 1);
}

export function formatDisplayTime(stored: string | null | undefined): string | null {
  if (!stored) return null;
  const m = stored.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return stored;
  const h = parseInt(m[1]);
  const mins = m[2];
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${mins} ${period}`;
}

export function callStatus(
  call: { callDate: string; callTime: string | null; endTime: string | null },
  today: string,
  currentTime: string,
): "live" | "upcoming" | "past" {
  if (call.callDate < today) return "past";
  if (call.callDate > today) return "upcoming";
  if (call.endTime && call.endTime <= currentTime) return "past";
  if (call.callTime && call.callTime > currentTime) return "upcoming";
  return "live";
}

export function groupCallsByDate(
  calls: UserCalendarCall[],
): Map<string, UserCalendarCall[]> {
  const map = new Map<string, UserCalendarCall[]>();
  for (const call of calls) {
    const existing = map.get(call.callDate) ?? [];
    existing.push(call);
    map.set(call.callDate, existing);
  }
  return map;
}
