import { addMinutes, subHours } from "date-fns";
import { afterEach, expect, test, vi } from "vitest";
import { config } from "shared/config";
import {
  testProgramItem,
  testProgramItem2,
} from "shared/tests/testProgramItem";
import {
  assignmentTime,
  getUsers,
  groupCreatorGroupCode,
} from "server/features/assignment/utils/assignmentTestUtils";
import { getGroups } from "server/features/assignment/utils/getGroups";

afterEach(() => {
  vi.resetAllMocks();
});

test("excludes lottery signups for items whose lottery already ran (different start time)", () => {
  // A leftover sign-up for an item that already ran is kept on the user but must not
  // become a preference in a later lottery for a different start time
  const pastStartTime = subHours(new Date(assignmentTime), 2).toISOString();

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

// Same guard as getList: a preference the assigner has no event for makes it reject the whole
// input, so a program item outside the run must not reach it
test("excludes lottery signups for program items not in the run", () => {
  const users = getUsers({ count: 1 });

  const groups = getGroups([users], assignmentTime, [testProgramItem2]);

  expect(groups).toEqual([{ id: groupCreatorGroupCode, size: 1, pref: [] }]);
});
