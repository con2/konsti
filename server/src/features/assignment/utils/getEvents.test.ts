import { addMinutes, subHours } from "date-fns";
import { afterEach, expect, test, vi } from "vitest";
import { config } from "shared/config";
import { DIRECT_SIGNUP_PRIORITY } from "shared/constants/signups";
import {
  testProgramItem,
  testProgramItem2,
} from "shared/tests/testProgramItem";
import { getPreviousDirectSignup } from "server/features/assignment/utils/assignmentTestUtils";
import { getEvents } from "server/features/assignment/utils/getEvents";
import { DirectSignupsForProgramItem } from "server/features/direct-signup/directSignupTypes";

afterEach(() => {
  vi.resetAllMocks();
});

test("should not produce negative max or min greater than max when existing direct sign-ups exceed capacity", () => {
  // Item already has more changed-start-time direct sign-ups than its capacity
  const programItem = {
    ...testProgramItem,
    minAttendance: 2,
    maxAttendance: 2,
  };

  const changedStartTime = subHours(
    new Date(testProgramItem.startTime),
    1,
  ).toISOString();

  const directSignups: DirectSignupsForProgramItem[] = [
    {
      programItemId: programItem.programItemId,
      count: 3,
      userSignups: ["user1", "user2", "user3"].map((username) => ({
        username,
        priority: DIRECT_SIGNUP_PRIORITY,
        signedToStartTime: changedStartTime,
        signupTime: testProgramItem.startTime,
        message: "",
      })),
    },
  ];

  const events = getEvents([programItem], directSignups);

  // No remaining capacity -> item takes no lottery attendees (never min > max or negative max)
  expect(events).toEqual([
    {
      id: programItem.programItemId,
      min: 0,
      max: 0,
      groups: [],
    },
  ]);
});

test("should return as many events as program items", () => {
  const events = getEvents(
    [testProgramItem, testProgramItem2],
    [getPreviousDirectSignup({ username: "some username" })],
  );

  expect(events).toEqual(
    expect.arrayContaining([
      {
        id: testProgramItem.programItemId,
        min: testProgramItem.minAttendance - 1,
        max: testProgramItem.maxAttendance - 1,
        groups: [],
      },
      {
        id: testProgramItem2.programItemId,
        min: testProgramItem2.minAttendance,
        max: testProgramItem2.maxAttendance,
        groups: [],
      },
    ]),
  );
});

test("should return events for program items using parent startTime via 'startTimesByParentIds'", () => {
  const parentStartTime = addMinutes(
    new Date(testProgramItem.startTime),
    30,
  ).toISOString();

  vi.spyOn(config, "event").mockReturnValue({
    ...config.event(),
    startTimesByParentIds: new Map([
      [testProgramItem.parentId, parentStartTime],
    ]),
  });

  const events = getEvents(
    [testProgramItem, testProgramItem2],
    [getPreviousDirectSignup({ username: "some username", parentStartTime })],
  );

  expect(events).toEqual(
    expect.arrayContaining([
      {
        id: testProgramItem.programItemId,
        min: testProgramItem.minAttendance - 1,
        max: testProgramItem.maxAttendance - 1,
        groups: [],
      },
      {
        id: testProgramItem2.programItemId,
        min: testProgramItem2.minAttendance,
        max: testProgramItem2.maxAttendance,
        groups: [],
      },
    ]),
  );
});

test("should count a direct sign-up made for this same start time against capacity", () => {
  // A program item the lottery takes holds no direct sign-ups at all, so this is defence in
  // depth. Offering the seat anyway would have the assigner fill a program item past its limit,
  // leaving the save to drop whole groups back out of it
  const directSignups: DirectSignupsForProgramItem[] = [
    {
      programItemId: testProgramItem.programItemId,
      count: 1,
      userSignups: [
        {
          username: "some username",
          priority: 1,
          signedToStartTime: testProgramItem.startTime,
          signupTime: testProgramItem.startTime,
          message: "",
        },
      ],
    },
  ];

  const events = getEvents([testProgramItem], directSignups);

  expect(events).toEqual([
    {
      id: testProgramItem.programItemId,
      min: testProgramItem.minAttendance - 1,
      max: testProgramItem.maxAttendance - 1,
      groups: [],
    },
  ]);
});
