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

test("should not produce negative max or min greater than max when existing signups exceed capacity", () => {
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

test("should count a signup made for this same start time against capacity", () => {
  // Not a sign-up carried in from a moved program item: this one was made for the very
  // start time being assigned, by an earlier run of this lottery or by direct sign-up
  // after it. The attendee holding it is kept out of the run, so its spot is taken
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
