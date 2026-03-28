import { describe, it, expect } from "vitest";
import { toDateStr, localTodayStr, localTodayUTC, formatDate } from "@/lib/dates";

describe("toDateStr", () => {
  it("extracts the UTC date from a midnight-UTC DB date", () => {
    const d = new Date("2026-03-27T00:00:00.000Z");
    expect(toDateStr(d)).toBe("2026-03-27");
  });

  it("always uses UTC, so 11pm UTC- does not bleed into the next day", () => {
    // 2026-03-27T23:00:00Z is 11pm UTC, still "2026-03-27" in UTC
    const d = new Date("2026-03-27T23:00:00.000Z");
    expect(toDateStr(d)).toBe("2026-03-27");
  });

  it("does not use local time — a UTC midnight date always returns its UTC date string", () => {
    // Regardless of what the local timezone is, toDateStr reads the UTC date.
    const d = new Date("2026-01-01T00:00:00.000Z");
    expect(toDateStr(d)).toBe("2026-01-01");
  });
});

describe("localTodayStr", () => {
  it("returns today's date in the given timezone", () => {
    // 2am UTC on Mar 27 is still Mar 26 in UTC-5 (New York, non-DST)
    const now = new Date("2026-03-27T02:00:00.000Z");
    expect(localTodayStr(now, "America/New_York")).toBe("2026-03-26");
  });

  it("returns the UTC date when timezone is UTC", () => {
    const now = new Date("2026-03-27T02:00:00.000Z");
    expect(localTodayStr(now, "UTC")).toBe("2026-03-27");
  });

  it("returns the next day for UTC+ timezones where local time has crossed midnight", () => {
    // 11pm UTC on Mar 26 is already Mar 27 in UTC+2 (e.g. Europe/Helsinki)
    const now = new Date("2026-03-26T23:00:00.000Z");
    expect(localTodayStr(now, "Europe/Helsinki")).toBe("2026-03-27");
  });

  it("returns the same date as UTC when local time is well within the day", () => {
    const now = new Date("2026-03-27T14:00:00.000Z");
    expect(localTodayStr(now, "America/Los_Angeles")).toBe("2026-03-27");
  });
});

describe("localTodayUTC", () => {
  it("returns midnight UTC for the local today date", () => {
    // 2am UTC Mar 27 = Mar 26 in New York → should return Mar 26 midnight UTC
    const now = new Date("2026-03-27T02:00:00.000Z");
    const result = localTodayUTC(now, "America/New_York");
    expect(result.toISOString()).toBe("2026-03-26T00:00:00.000Z");
  });

  it("matches how DB dates are stored, so dinner lookup works correctly", () => {
    // A dinner saved as "2026-03-27" is stored as 2026-03-27T00:00:00Z.
    // localTodayUTC at noon UTC on Mar 27 (UTC+2 → still Mar 27) must equal that.
    const now = new Date("2026-03-27T10:00:00.000Z");
    const today = localTodayUTC(now, "Europe/Helsinki"); // UTC+2, so local = Mar 27
    const dbDate = new Date("2026-03-27T00:00:00.000Z");
    expect(today.getTime()).toBe(dbDate.getTime());
  });
});

describe("formatDate", () => {
  it("formats a DB midnight-UTC date as a readable weekday string", () => {
    const d = new Date("2026-03-27T00:00:00.000Z"); // a Friday
    expect(formatDate(d)).toBe("Friday, Mar 27");
  });

  it("always uses UTC so the display date matches the stored date", () => {
    // Even in a UTC-5 environment, Mar 27 midnight UTC should display as Mar 27
    const d = new Date("2026-03-27T00:00:00.000Z");
    expect(formatDate(d)).toContain("Mar 27");
  });
});
