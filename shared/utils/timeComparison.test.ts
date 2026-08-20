import { describe, expect, test } from "vitest";
import {
  isBetweenExclusive,
  isSameOrAfter,
  isSameOrBefore,
  isWithinMinutes,
} from "shared/utils/timeComparison";

const earlier = new Date("2026-07-25T12:00:00Z");
const same = new Date("2026-07-25T12:00:00Z");
const later = new Date("2026-07-25T13:00:00Z");
const invalid = new Date("not-a-date");

describe("isSameOrAfter", () => {
  test.each([
    [later, earlier, true],
    [same, earlier, true],
    [earlier, later, false],
  ])("(%s, %s) is %s", (time, compared, expected) => {
    expect(isSameOrAfter(time, compared)).toEqual(expected);
  });
});

describe("isSameOrBefore", () => {
  test.each([
    [earlier, later, true],
    [same, earlier, true],
    [later, earlier, false],
  ])("(%s, %s) is %s", (time, compared, expected) => {
    expect(isSameOrBefore(time, compared)).toEqual(expected);
  });
});

// These gate whether sign-up is open. Written as !isBefore / !isAfter they are
// both true against an invalid date at once, which opens every window that
// should be closed
describe("An invalid date compares false, not true", () => {
  test.each([
    ["isSameOrAfter, invalid on the right", isSameOrAfter(earlier, invalid)],
    ["isSameOrAfter, invalid on the left", isSameOrAfter(invalid, earlier)],
    ["isSameOrBefore, invalid on the right", isSameOrBefore(earlier, invalid)],
    ["isSameOrBefore, invalid on the left", isSameOrBefore(invalid, earlier)],
    ["isWithinMinutes, invalid time", isWithinMinutes(invalid, earlier, later)],
    ["isWithinMinutes, invalid start", isWithinMinutes(same, invalid, later)],
    ["isWithinMinutes, invalid end", isWithinMinutes(same, earlier, invalid)],
    [
      "isBetweenExclusive, invalid time",
      isBetweenExclusive(invalid, earlier, later),
    ],
  ])("%s", (_name, result) => {
    expect(result).toEqual(false);
  });

  test("an invalid date is never both at or after and at or before", () => {
    expect(
      isSameOrAfter(earlier, invalid) && isSameOrBefore(earlier, invalid),
    ).toEqual(false);
  });
});

describe("isWithinMinutes includes the start and excludes the end", () => {
  const start = new Date("2026-07-25T12:00:00Z");
  const end = new Date("2026-07-25T13:00:00Z");

  test.each([
    [new Date("2026-07-25T11:59:59Z"), false],
    [new Date("2026-07-25T12:00:00Z"), true], // start included
    [new Date("2026-07-25T12:00:59Z"), true], // same minute as the start
    [new Date("2026-07-25T12:59:59Z"), true],
    [new Date("2026-07-25T13:00:00Z"), false], // end excluded
  ])("%s is %s", (time, expected) => {
    expect(isWithinMinutes(time, start, end)).toEqual(expected);
  });
});

describe("isBetweenExclusive excludes both ends", () => {
  test.each([
    [earlier, false],
    [new Date("2026-07-25T12:30:00Z"), true],
    [later, false],
  ])("%s is %s", (time, expected) => {
    expect(isBetweenExclusive(time, earlier, later)).toEqual(expected);
  });
});
