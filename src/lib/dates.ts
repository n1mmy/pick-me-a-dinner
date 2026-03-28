/**
 * Date utilities for the dinner tracker.
 *
 * Dinner dates are stored in the DB as midnight UTC for the local date string
 * (e.g. "2026-03-27" → 2026-03-27T00:00:00.000Z). All DB-date arithmetic
 * therefore uses UTC methods. The only place we use local time is when
 * determining what date "today" is — controlled by the TZ environment variable.
 */

/** Extract the YYYY-MM-DD string from a DB date (stored as midnight UTC). */
export function toDateStr(d: Date): string {
  return d.toISOString().split("T")[0];
}

/**
 * Today's YYYY-MM-DD in the server's local timezone.
 * Pass `now` and/or `tz` to override for testing.
 */
export function localTodayStr(now: Date = new Date(), tz?: string): string {
  return now.toLocaleDateString("en-CA", tz ? { timeZone: tz } : undefined);
}

/**
 * Midnight-UTC Date for today in the server's local timezone,
 * matching the DB storage format.
 */
export function localTodayUTC(now: Date = new Date(), tz?: string): Date {
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
