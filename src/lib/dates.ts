/**
 * Date utilities for the dinner tracker.
 *
 * Dinner dates are stored in the DB as midnight UTC for the *local* (Pacific)
 * date string — e.g. "2026-03-27" → 2026-03-27T00:00:00.000Z. All DB-date
 * arithmetic and display therefore uses UTC methods. The only place we use
 * local time is when determining what date "today" is for the household, and
 * we hardcode that to America/Los_Angeles so it works regardless of the
 * server's TZ env var.
 */

export const APP_TZ = "America/Los_Angeles";

/** Extract the YYYY-MM-DD string from a DB date (stored as midnight UTC). */
export function toDateStr(d: Date): string {
  return d.toISOString().split("T")[0];
}

/**
 * Today's YYYY-MM-DD in the household timezone (Pacific).
 * Pass `now` and/or `tz` to override for testing.
 */
export function localTodayStr(now: Date = new Date(), tz: string = APP_TZ): string {
  return now.toLocaleDateString("en-CA", { timeZone: tz });
}

/**
 * Midnight-UTC Date for today in the household timezone,
 * matching the DB storage format.
 */
export function localTodayUTC(now: Date = new Date(), tz: string = APP_TZ): Date {
  return new Date(localTodayStr(now, tz) + "T00:00:00.000Z");
}

/** Format a DB date for display (weekday, month, day). */
export function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

/**
 * Format a DB date as "Mon Day" (or "Mon Day, Year" if not the current year).
 * The dinner date is read in UTC (matching storage); the year-comparison uses
 * the household timezone so "this year" matches what the user sees.
 */
export function formatShortDate(d: Date, now: Date = new Date()): string {
  const dinnerYear = d.getUTCFullYear();
  const todayYear = parseInt(localTodayStr(now).slice(0, 4), 10);
  const sameYear = dinnerYear === todayYear;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
    ...(!sameYear && { year: "numeric" }),
  });
}
