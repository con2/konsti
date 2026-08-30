import { describe, expect, test } from "vitest";
import {
  bucketByHour,
  dayOfWeek,
} from "server/features/statistics/doc-generators/statsUtils";

// Both helpers bucket instants by their Europe/Helsinki wall clock, so an instant
// late in the UTC evening belongs to the next local day. Getting that wrong shifts
// whole rows of the generated statistics onto the wrong day.
describe("bucketByHour", () => {
  test.each([
    ["2026-01-15T10:30:00Z", "2026-01-15", 12], // winter, GMT+2
    ["2026-07-15T10:30:00Z", "2026-07-15", 13], // summer, GMT+3
    ["2026-02-10T22:00:00Z", "2026-02-11", 0], // UTC evening is the next local day
    ["2026-07-31T21:30:00Z", "2026-08-01", 0], // and the next local month
    ["2026-12-31T22:30:00Z", "2027-01-01", 0], // and the next local year
  ])("%s buckets to %s hour %s", (time, day, hour) => {
    expect(bucketByHour(time)).toEqual({ day, hour });
  });

  test.each([
    ["2026-03-29T00:59:00Z", "2026-03-29", 2], // last minute before spring-forward
    ["2026-03-29T01:00:00Z", "2026-03-29", 4], // clocks jumped 03:00 -> 04:00
    ["2026-10-25T00:59:00Z", "2026-10-25", 3], // last minute of GMT+3
    ["2026-10-25T01:00:00Z", "2026-10-25", 3], // clocks fell back 04:00 -> 03:00
  ])("%s buckets to %s hour %s across DST", (time, day, hour) => {
    expect(bucketByHour(time)).toEqual({ day, hour });
  });
});

describe("dayOfWeek", () => {
  test.each([
    ["2026-01-15", "Thu"],
    ["2026-07-15", "Wed"],
    ["2026-03-29", "Sun"], // spring-forward day
    ["2026-10-25", "Sun"], // fall-back day
    ["2026-08-01", "Sat"], // month boundary
    ["2027-01-01", "Fri"], // year boundary
  ])("%s is %s", (isoDay, expected) => {
    expect(dayOfWeek(isoDay)).toEqual(expected);
  });
});
