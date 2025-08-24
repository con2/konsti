import { afterEach, expect, test, vi } from "vitest";
import dayjs from "dayjs";
import {
  testProgramItem,
  testProgramItem2,
} from "shared/tests/testProgramItem";
import { config } from "shared/config";
import { getEvents } from "server/features/assignment/utils/getEvents";
import { getPreviousDirectSignup } from "server/features/assignment/utils/assignmentTestUtils";

afterEach(() => {
  vi.resetAllMocks();
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
  const parentStartTime = dayjs(testProgramItem.startTime)
    .add(30, "minutes")
    .toISOString();

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
