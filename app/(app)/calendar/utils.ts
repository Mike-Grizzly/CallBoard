import type { UserCalendarCall } from "@/features/calls/queries";

export type CalendarView = "month" | "week" | "day" | "agenda";

/** Event shape consumed by the calendar views. Adapted from UserCalendarCall. */
export type CalEvent = {
  id: string;
  productionId: string;
  productionTitle: string;
  productionSlug: string;
  productionColorVar: string;
  type: "rehearsal";
  title: string;
  loc: string | null;
  date: string;
  time: string;
  durMin: number;
  endTime: string | null;
  allDay: boolean;
};

export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export const HOUR_PX = 44;
export const DAY_START_HOUR = 8;
export const DAY_END_HOUR = 23;

export function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function parseYmd(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function sameYMD(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString();
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function startOfWeek(d: Date): Date {
  const x = new Date(d);
  x.setDate(x.getDate() - x.getDay());
  x.setHours(0, 0, 0, 0);
  return x;
}

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function fmtTime(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = ((h + 11) % 12) + 1;
  return `${h12}${m ? ":" + String(m).padStart(2, "0") : ""} ${ampm}`;
}

export function minToY(mins: number, hourPx: number): number {
  return (mins / 60) * hourPx;
}

export function parseDateParam(raw: string | undefined): Date {
  if (raw && /^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [y, m, d] = raw.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    if (!isNaN(dt.getTime())) return dt;
  }
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function parseView(raw: string | undefined): CalendarView {
  if (raw === "week" || raw === "day" || raw === "agenda" || raw === "month") return raw;
  return "week";
}

/** Convert a stored call row into a calendar event. */
export function callToEvent(
  call: UserCalendarCall,
  productionColorVar: string,
): CalEvent {
  const time = call.callTime ?? "00:00";
  let durMin = 120; // sensible default if we don't know the end
  let allDay = false;
  if (call.callTime && call.endTime) {
    const [sh, sm] = call.callTime.split(":").map(Number);
    const [eh, em] = call.endTime.split(":").map(Number);
    durMin = Math.max(15, eh * 60 + em - (sh * 60 + sm));
  } else if (!call.callTime) {
    allDay = true;
    durMin = 1440;
  }
  return {
    id: call.id,
    productionId: call.productionId,
    productionTitle: call.productionTitle,
    productionSlug: call.productionSlug,
    productionColorVar,
    type: "rehearsal",
    title: call.focus ?? "Rehearsal",
    loc: call.location,
    date: call.callDate,
    time,
    durMin,
    endTime: call.endTime,
    allDay,
  };
}
