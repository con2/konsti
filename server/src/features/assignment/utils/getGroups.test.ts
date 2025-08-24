import { afterEach, expect, test, vi } from "vitest";
import dayjs from "dayjs";
import { getGroups } from "server/features/assignment/utils/getGroups";
import { testProgramItem } from "shared/tests/testProgramItem";
import { config } from "shared/config";
import {
  assignmentTime,
  getUsers,
  groupCreatorGroupCode,
} from "server/features/assignment/utils/assignmentTestUtils";

afterEach(() => {
  vi.resetAllMocks();
});

test("should return as many groups as user groups", () => {
  const users = getUsers({ count: 1 });
  const attendeeGroups = [users, users, users];

  const groups = getGroups(attendeeGroups, assignmentTime, [testProgramItem]);

  expect(groups).toEqual([
    {
      id: groupCreatorGroupCode,
      size: 1,
      pref: [testProgramItem.programItemId],
    },
    {
      id: groupCreatorGroupCode,
      size: 1,
      pref: [testProgramItem.programItemId],
    },
    {
      id: groupCreatorGroupCode,
      size: 1,
      pref: [testProgramItem.programItemId],
    },
  ]);
});

test("should return groups for program items using parent startTime via 'startTimesByParentIds'", () => {
  const parentStartTime = dayjs(testProgramItem.startTime)
    .add(30, "minutes")
    .toISOString();

  vi.spyOn(config, "event").mockReturnValue({
    ...config.event(),
    startTimesByParentIds: new Map([
      [testProgramItem.parentId, parentStartTime],
    ]),
  });

  const users = getUsers({ count: 1 });
  const attendeeGroups = [users, users, users];

  const groups = getGroups(attendeeGroups, parentStartTime, [testProgramItem]);

  expect(groups).toEqual([
    {
      id: groupCreatorGroupCode,
      size: 1,
      pref: [testProgramItem.programItemId],
    },
    {
      id: groupCreatorGroupCode,
      size: 1,
      pref: [testProgramItem.programItemId],
    },
    {
      id: groupCreatorGroupCode,
      size: 1,
      pref: [testProgramItem.programItemId],
    },
  ]);
});
