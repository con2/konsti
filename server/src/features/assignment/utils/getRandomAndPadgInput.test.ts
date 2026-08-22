import { expect, test } from "vitest";
import { testProgramItem } from "shared/tests/testProgramItem";
import { getUsers } from "server/features/assignment/utils/assignmentTestUtils";
import { getRandomAndPadgInput } from "server/features/assignment/utils/getRandomAndPadgInput";

test("does not duplicate a group when a non-creator member has a stray lottery signup", () => {
  // One group: a creator with lottery sign-ups plus two members without sign-ups
  const users = getUsers({ count: 3 });

  // A non-creator member ends up with a stray lottery sign-up for the starting program item.
  // This must not turn them into a second "group creator" and duplicate the group.
  const usersWithStrayMemberSignup = users.map((user) =>
    user.username === "group-member-1"
      ? {
          ...user,
          lotterySignups: [
            {
              programItemId: testProgramItem.programItemId,
              priority: 1,
              signedToStartTime: testProgramItem.startTime,
            },
          ],
        }
      : user,
  );

  const { attendeeGroups, allAttendees } = getRandomAndPadgInput(
    usersWithStrayMemberSignup,
    [testProgramItem],
    new Set(),
  );

  // The lottery should still see exactly one group of the three real members, with no duplicates
  const usernames = allAttendees.map((attendee) => attendee.username);
  expect(usernames).toHaveLength(3);
  expect(new Set(usernames).size).toEqual(3);
  expect(attendeeGroups).toHaveLength(1);
  expect(attendeeGroups[0]).toHaveLength(3);
});
