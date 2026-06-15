// Shared helpers for projecting a recurring call/rehearsal pattern across a
// date range. Used by both the calendar's call generator (`generateCalls`) and
// the new-production wizard's rehearsal-pattern autofill, so the two stay
// consistent. Kept in a plain module (not a "use server" file) so the
// non-async helpers/constants can be imported anywhere.

/** Guard against runaway generation (e.g. a typo'd 10-year range). */
export const MAX_GENERATED_CALLS = 200;

export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** JS `getUTCDay()` index (0 = Sun … 6 = Sat) for each wizard day label. */
export const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

/** Every YYYY-MM-DD date from `start` to `end` inclusive (UTC). */
export function datesInRange(start: string, end: string): string[] {
  const out: string[] = [];
  const cursor = new Date(`${start}T00:00:00Z`);
  const last = new Date(`${end}T00:00:00Z`);
  while (cursor <= last) {
    out.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return out;
}

export function weekdayOf(date: string): number {
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}
