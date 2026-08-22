import { tz } from "@date-fns/tz";
import { isSameDay } from "date-fns";
import { afterEach, describe, expect, test, vi } from "vitest";
import { config } from "shared/config";
import {
  testProgramItem,
  testProgramItem2,
} from "shared/tests/testProgramItem";
import { TIMEZONE } from "shared/utils/timezone";
import {
  getDirectSignupForSlot,
  isSameDayInEventTimezone,
} from "client/views/program-item/programItemUtils";

afterEach(() => {
  vi.restoreAllMocks();
});

test("matches a direct signup in a program item starting at the same time", () => {
  const directSignups = [
    {
      programItem: {
        ...testProgramItem2,
        startTime: testProgramItem.startTime,
      },
    },
  ];

  expect(getDirectSignupForSlot(directSignups, testProgramItem)).toEqual(
    directSignups[0],
  );
});

test("returns undefined when no direct signup occupies the slot", () => {
  const directSignups = [
    {
      programItem: {
        ...testProgramItem2,
        startTime: "2019-07-26T20:00:00.000Z",
      },
    },
  ];

  expect(
    getDirectSignupForSlot(directSignups, testProgramItem),
  ).toBeUndefined();
});

test("matches through the parent-resolved start time", () => {
  // The lottery item is batched under a parent whose start time drives the lottery, so the
  // slot it occupies is the parent's time rather than the item's own
  const parentStartTime = "2019-07-26T18:00:00.000Z";

  vi.spyOn(config, "event").mockReturnValue({
    ...config.event(),
    startTimesByParentIds: new Map([
      [testProgramItem.parentId, parentStartTime],
    ]),
  });

  const directSignups = [
    { programItem: { ...testProgramItem2, startTime: parentStartTime } },
  ];

  expect(getDirectSignupForSlot(directSignups, testProgramItem)).toEqual(
    directSignups[0],
  );
});

test("matches the same instant written with and without milliseconds", () => {
  // A configured parent start time is hand-written without milliseconds, while a program
  // item's own start time reaches the client from toISOString - the same moment, two strings
  const parentStartTime = "2019-07-26T18:00:00Z";

  vi.spyOn(config, "event").mockReturnValue({
    ...config.event(),
    startTimesByParentIds: new Map([
      [testProgramItem.parentId, parentStartTime],
    ]),
  });

  const directSignups = [
    {
      programItem: {
        ...testProgramItem2,
        startTime: "2019-07-26T18:00:00.000Z",
      },
    },
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
