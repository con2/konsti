import { expect, test } from "vitest";
import { testProgramItem } from "shared/tests/testProgramItem";
import {
  assignmentTime,
  getUsers,
  groupCreatorGroupCode,
} from "server/features/assignment/utils/assignmentTestUtils";
import { getAssignmentResultGroups } from "server/features/assignment/utils/getAssignmentResultGroups";

test("should snapshot the group and its members that took part in the lottery", () => {
  // Group creator with lottery sign-ups + two members sharing the group code
  const users = getUsers({ count: 3 });

  const groups = getAssignmentResultGroups(
    users,
    [testProgramItem],
    assignmentTime,
  );

  expect(groups).toEqual([
    {
      groupCode: groupCreatorGroupCode,
      groupCreatorId: "group-creator-with-lottery-signup-id",
      groupMemberIds: [
        "group-creator-with-lottery-signup-id",
        "group-member-1-id",
        "group-member-2-id",
      ],
    },
  ]);
});

test("should exclude individual users not in a group", () => {
  const users = getUsers({ count: 2 });
  // Individual user (groupCode "0") who also took part in the lottery
  const individualUser = {
    ...users[0],
    username: "individual-user",
    isGroupCreator: false,
    groupCode: "0",
  };

  const groups = getAssignmentResultGroups(
    [...users, individualUser],
    [testProgramItem],
    assignmentTime,
  );

  expect(groups).toEqual([
    {
      groupCode: groupCreatorGroupCode,
      groupCreatorId: "group-creator-with-lottery-signup-id",
      groupMemberIds: [
        "group-creator-with-lottery-signup-id",
        "group-member-1-id",
      ],
    },
  ]);
});
