import { afterEach, expect, test, vi } from "vitest";
import dayjs from "dayjs";
import { getGroups } from "server/features/assignment/utils/getGroups";
import {
  testProgramItem,
  testProgramItem2,
} from "shared/tests/testProgramItem";
import { config } from "shared/config";
import {
  assignmentTime,
  getUsers,
  groupCreatorGroupCode,
} from "server/features/assignment/utils/assignmentTestUtils";

afterEach(() => {
  vi.resetAllMocks();
});

test("excludes lottery signups for items whose lottery already ran (different start time)", () => {
  // A leftover signup for an item that already ran is kept on the user but must not
  // become a preference in a later lottery for a different start time
  const pastStartTime = dayjs(assignmentTime)
    .subtract(2, "hours")
    .toISOString();

  const user = {
    ...getUsers({ count: 1 })[0],
    lotterySignups: [
      {
        programItemId: testProgramItem2.programItemId,
        priority: 1,
        signedToStartTime: pastStartTime,
      },
      {
        programItemId: testProgramItem.programItemId,
        priority: 1,
        signedToStartTime: testProgramItem.startTime,
      },
    ],
  };

  const groups = getGroups([[user]], assignmentTime, [testProgramItem]);

  expect(groups).toHaveLength(1);
  expect(groups[0].pref).toEqual([testProgramItem.programItemId]);
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
