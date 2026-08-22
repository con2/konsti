import { expect, test } from "vitest";
import { DIRECT_SIGNUP_PRIORITY } from "shared/constants/signups";
import {
  testProgramItem,
  testProgramItem2,
} from "shared/tests/testProgramItem";
import { getSettledAttendeeUsernames } from "server/features/assignment/utils/getSettledAttendeeUsernames";
import { DirectSignupsForProgramItem } from "server/features/direct-signup/directSignupTypes";

const getDirectSignup = (
  programItemId: string,
  usernames: string[],
  priority: number,
): DirectSignupsForProgramItem => ({
  programItemId,
  count: usernames.length,
  userSignups: usernames.map((username) => ({
    username,
    priority,
    signedToStartTime: testProgramItem.startTime,
    signupTime: testProgramItem.startTime,
    message: "",
  })),
});

test("should settle attendees holding a spot in a starting program item", () => {
  const settled = getSettledAttendeeUsernames(
    [testProgramItem],
    [getDirectSignup(testProgramItem.programItemId, ["user1", "user2"], 1)],
  );

  expect([...settled].toSorted((a, b) => a.localeCompare(b))).toEqual([
    "user1",
    "user2",
  ]);
});

test("should settle a first-come-first-served spot the same as a lottery win", () => {
  // Holding a spot is what settles an attendee, not how they came by it
  const settled = getSettledAttendeeUsernames(
    [testProgramItem],
    [
      getDirectSignup(
        testProgramItem.programItemId,
        ["user1"],
        DIRECT_SIGNUP_PRIORITY,
      ),
    ],
  );

  expect([...settled]).toEqual(["user1"]);
});

test("should settle a spot in a program item the lottery doesn't allocate", () => {
  // An always-open program item's spots are never counted against lottery capacity, but
  // their holders are settled all the same: the lottery only places attendees with none
  const alwaysOpenProgramItem = {
    ...testProgramItem2,
    startTime: testProgramItem.startTime,
  };

  const settled = getSettledAttendeeUsernames(
    [testProgramItem, alwaysOpenProgramItem],
    [
      getDirectSignup(
        alwaysOpenProgramItem.programItemId,
        ["user1"],
        DIRECT_SIGNUP_PRIORITY,
      ),
    ],
  );

  expect([...settled]).toEqual(["user1"]);
});

test("should not settle attendees whose spot is in a program item starting at another time", () => {
  const settled = getSettledAttendeeUsernames(
    [testProgramItem],
    [getDirectSignup(testProgramItem2.programItemId, ["user1"], 1)],
  );

  expect([...settled]).toEqual([]);
});
