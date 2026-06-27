import { expect, test } from "vitest";
import { testProgramItem } from "shared/tests/testProgramItem";
import { getAssignmentResultGroups } from "server/features/assignment/utils/getAssignmentResultGroups";
import {
  assignmentTime,
  getUsers,
  groupCreatorGroupCode,
} from "server/features/assignment/utils/assignmentTestUtils";

test("should snapshot the group and its members that took part in the lottery", () => {
  // Group creator with lottery signups + two members sharing the group code
  const users = getUsers({ count: 3 });

  const groups = getAssignmentResultGroups(
    users,
    [testProgramItem],
    assignmentTime,
  );

  expect(groups).toEqual([
    {
      groupCode: groupCreatorGroupCode,
      groupCreator: "group-creator-with-lottery-signup",
      groupMembers: [
        "group-creator-with-lottery-signup",
        "group-member-1",
        "group-member-2",
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
      groupCreator: "group-creator-with-lottery-signup",
      groupMembers: ["group-creator-with-lottery-signup", "group-member-1"],
    },
  ]);
});
