import { TZDate } from "@date-fns/tz";
import { describe, expect, test } from "vitest";
import { TIMEZONE } from "shared/utils/timezone";
import { atWallClockHourInEventTimezone } from "shared/utils/zonedTime";

// Months are zero-based, as in the Date constructor this mirrors
const OCTOBER = 9;
const MARCH = 2;
const JULY = 6;
const JANUARY = 0;

describe("Resolves an ordinary wall-clock hour", () => {
  test.each([
    [2026, JANUARY, 15, 22, "2026-01-15T20:00:00.000Z"], // GMT+2
    [2026, JULY, 15, 22, "2026-07-15T19:00:00.000Z"], // GMT+3
    [2026, JULY, 15, 18, "2026-07-15T15:00:00.000Z"],
    [2026, JANUARY, 1, 0, "2025-12-31T22:00:00.000Z"], // midnight, previous year in UTC
  ])("%s-%s-%s %s:00 is %s", (year, month, day, hour, expected) => {
    expect(
      atWallClockHourInEventTimezone(year, month, day, hour).toISOString(),
    ).toEqual(expected);
  });
});

// 03:00 on the autumn transition day happens twice, once at GMT+3 and again an
// hour later at GMT+2. Which one a bare TZDate lands on depends on the host's
// own timezone, so the choice is made explicitly and is the same everywhere
describe("Resolves the repeated autumn hour to its first occurrence", () => {
  const repeated = atWallClockHourInEventTimezone(2026, OCTOBER, 25, 3);

  test("picks the earlier of the two instants", () => {
    expect(repeated.toISOString()).toEqual("2026-10-25T00:00:00.000Z");
  });

  test("both candidate instants really do share that wall clock", () => {
    const hours = ["2026-10-25T00:00:00Z", "2026-10-25T01:00:00Z"].map((iso) =>
      new TZDate(new Date(iso), TIMEZONE).getHours(),
    );
    expect(hours).toEqual([3, 3]);
  });

  test("the hours actually used are unaffected", () => {
    expect(
      atWallClockHourInEventTimezone(2026, OCTOBER, 25, 22).toISOString(),
    ).toEqual("2026-10-25T20:00:00.000Z");
    expect(
      atWallClockHourInEventTimezone(2026, OCTOBER, 25, 18).toISOString(),
    ).toEqual("2026-10-25T16:00:00.000Z");
  });
});

// 03:00 on the spring transition day never happens: the clock goes 02:59 -> 04:00
describe("Resolves the skipped spring hour forward", () => {
  test("lands on the instant the wall clock an hour later would give", () => {
    const skipped = atWallClockHourInEventTimezone(2026, MARCH, 29, 3);
    const nextHour = atWallClockHourInEventTimezone(2026, MARCH, 29, 4);
    expect(skipped.toISOString()).toEqual(nextHour.toISOString());
  });

  test("the hours actually used are unaffected", () => {
    expect(
      atWallClockHourInEventTimezone(2026, MARCH, 29, 22).toISOString(),
    ).toEqual("2026-03-29T19:00:00.000Z");
    expect(
      atWallClockHourInEventTimezone(2026, MARCH, 29, 18).toISOString(),
    ).toEqual("2026-03-29T15:00:00.000Z");
  });
});
