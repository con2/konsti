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

test("matches a direct sign-up in a program item starting at the same time", () => {
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

test("returns undefined when no direct sign-up occupies the slot", () => {
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

// The parent batches a lottery; it says nothing about when an attendee turns up, so a spot in a
// batched program item occupies its own hour
test("ignores the parent start time when matching a slot", () => {
  const parentStartTime = "2019-07-26T18:00:00.000Z";

  vi.spyOn(config, "event").mockReturnValue({
    ...config.event(),
    startTimesByParentIds: new Map([
      [testProgramItem.parentId, parentStartTime],
    ]),
  });

  // The held spot resolves to the same lottery as testProgramItem, but runs at another hour
  const directSignups = [
    { programItem: { ...testProgramItem2, startTime: parentStartTime } },
  ];

  expect(
    getDirectSignupForSlot(directSignups, testProgramItem),
  ).toBeUndefined();
});

test("matches a batched program item held at the same hour", () => {
  vi.spyOn(config, "event").mockReturnValue({
    ...config.event(),
    startTimesByParentIds: new Map([
      [testProgramItem.parentId, "2019-07-26T18:00:00.000Z"],
    ]),
  });

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

test("matches the same instant written with and without milliseconds", () => {
  const directSignups = [
    {
      programItem: {
        ...testProgramItem2,
        startTime: new Date(testProgramItem.startTime)
          .toISOString()
          .replace(".000Z", "Z"),
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
