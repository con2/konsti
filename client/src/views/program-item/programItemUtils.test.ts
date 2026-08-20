import { tz } from "@date-fns/tz";
import { isSameDay } from "date-fns";
import { afterEach, describe, expect, test, vi } from "vitest";
import { config } from "shared/config";
import { testProgramItem } from "shared/tests/testProgramItem";
import { TIMEZONE } from "shared/utils/timezone";
import {
  getDirectSignupForSlot,
  isSameDayInEventTimezone,
} from "client/views/program-item/programItemUtils";

afterEach(() => {
  vi.restoreAllMocks();
});

test("matches a direct signup at the program item's own start time", () => {
  const directSignups = [
    { signedToStartTime: testProgramItem.startTime, programItemId: "other" },
  ];

  expect(getDirectSignupForSlot(directSignups, testProgramItem)).toEqual(
    directSignups[0],
  );
});

test("returns undefined when no direct signup occupies the slot", () => {
  const directSignups = [
    { signedToStartTime: "2019-07-26T20:00:00.000Z", programItemId: "other" },
  ];

  expect(
    getDirectSignupForSlot(directSignups, testProgramItem),
  ).toBeUndefined();
});

test("matches a direct signup stored at the parent-resolved start time", () => {
  // The lottery item is batched under a parent whose start time drives the lottery, so the
  // direct sign-up for the slot is stored at the parent time, not the item's own start time
  const parentStartTime = "2019-07-26T18:00:00.000Z";

  vi.spyOn(config, "event").mockReturnValue({
    ...config.event(),
    startTimesByParentIds: new Map([
      [testProgramItem.parentId, parentStartTime],
    ]),
  });

  const directSignups = [
    { signedToStartTime: parentStartTime, programItemId: "other" },
  ];

  expect(getDirectSignupForSlot(directSignups, testProgramItem)).toEqual(
    directSignups[0],
  );
});

// Hand-rolled for speed, so it is pinned against the date-fns equivalent it
// replaced rather than against hard-coded answers
describe("isSameDayInEventTimezone", () => {
  test.each([
    ["2026-07-25T20:00:00Z", "2026-07-25T22:00:00Z"], // crosses midnight in Helsinki
    ["2026-07-25T10:00:00Z", "2026-07-25T14:00:00Z"], // same day everywhere
    ["2026-01-15T21:30:00Z", "2026-01-15T23:30:00Z"], // winter offset
    ["2026-07-25T21:00:00Z", "2026-07-26T05:00:00Z"], // different days
    ["2026-10-24T22:00:00Z", "2026-10-25T00:30:00Z"], // across the autumn transition
    ["2026-03-28T23:00:00Z", "2026-03-29T02:00:00Z"], // across the spring transition
  ])("agrees with date-fns for %s / %s", (start, end) => {
    expect(isSameDayInEventTimezone(new Date(start), new Date(end))).toEqual(
      isSameDay(new Date(start), new Date(end), { in: tz(TIMEZONE) }),
    );
  });
});
