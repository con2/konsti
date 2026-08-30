import { isEqual } from "date-fns";
import { groupBy } from "remeda";
import { expect } from "vitest";
import { AssignmentAlgorithm } from "shared/config/eventConfigTypes";
import { DIRECT_SIGNUP_PRIORITY } from "shared/constants/signups";
import { MongoDbError } from "shared/types/api/errors";
import { EventLogAction } from "shared/types/models/eventLog";
import { UserAssignmentResult } from "shared/types/models/result";
import { User } from "shared/types/models/user";
import {
  Result,
  makeErrorResult,
  makeSuccessResult,
} from "shared/utils/result";
import { runAssignment } from "server/features/assignment/run-assignment/runAssignment";
import { getStartingProgramItems } from "server/features/assignment/utils/getStartingProgramItems";
import { getLotteryParticipantDirectSignups } from "server/features/assignment/utils/prepareAssignmentParams";
import { findDirectSignups } from "server/features/direct-signup/directSignupRepository";
import { findProgramItems } from "server/features/program-item/programItemRepository";
import { findUsers } from "server/features/user/userRepository";
import { createLotterySignups } from "server/test/test-data-generation/generators/createLotterySignups";
import { createProgramItems } from "server/test/test-data-generation/generators/createProgramItems";
import { generateTestUsers } from "server/test/test-data-generation/generators/generateTestData";
import { unsafelyUnwrap } from "server/test/utils/unsafelyUnwrapResult";
import { AssignmentResultStatus } from "server/types/resultTypes";
import { logger } from "server/utils/logger";

export const firstLotterySignupSlot = 3;

const getGroupCreator = (
  users: User[],
  user: User,
): Result<User, MongoDbError> => {
  // Group creator (or not in a group) -> user is their own creator
  if (user.isGroupCreator || user.groupCode === "0") {
    return makeSuccessResult(user);
  }

  // Group member -> find the group's creator
  const groupCreator = users.find(
    (creator) => creator.isGroupCreator && creator.groupCode === user.groupCode,
  );

  if (groupCreator) {
    return makeSuccessResult(groupCreator);
  }

  logger.error(new Error(`Group creator not found for user ${user.username}`));

  return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
};

export const verifyUserSignups = async (): Promise<
  Result<void, MongoDbError>
> => {
  logger.info("Verify lottery signups and signups match for users");

  const usersResult = await findUsers();
  if (!usersResult.ok) {
    return usersResult;
  }
  const users = usersResult.value;

  const signupsResult = await findDirectSignups();
  if (!signupsResult.ok) {
    return signupsResult;
  }
  const signups = signupsResult.value;

  const programItemsResult = await findProgramItems();
  if (!programItemsResult.ok) {
    return programItemsResult;
  }
  const programItems = programItemsResult.value;

  const lotteryParticipantDirectSignups = getLotteryParticipantDirectSignups(
    signups,
    programItems,
  );

  let mismatchFound = false;

  for (const {
    programItemId,
    userSignups,
  } of lotteryParticipantDirectSignups) {
    // Verify group member sign-ups match with group creators lotterySignups
    // If not in group -> user is group creator

    for (const userSignup of userSignups) {
      const matchingUser = users.find(
        (user) => user.username === userSignup.username,
      );

      if (!matchingUser) {
        logger.error(new Error(`No matching user: ${userSignup.username}`));
        mismatchFound = true;
        continue;
      }

      const groupCreatorResult = getGroupCreator(users, matchingUser);
      if (!groupCreatorResult.ok) {
        mismatchFound = true;
        continue;
      }

      const groupCreator = groupCreatorResult.value;

      const matchingCreatorLotterySignup = groupCreator.lotterySignups.some(
        (creatorLotterySignup) =>
          creatorLotterySignup.programItemId === programItemId &&
          isEqual(
            new Date(creatorLotterySignup.signedToStartTime),
            new Date(userSignup.signedToStartTime),
          ),
      );

      if (!matchingCreatorLotterySignup) {
        logger.error(
          new Error(
            `No matching signed program item found from group creator: ${userSignup.username} - ${programItemId}`,
          ),
        );
        mismatchFound = true;
      }
    }
  }

  if (mismatchFound) {
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }

  return makeSuccessResult();
};

export const assertUserUpdatedCorrectly = async (
  usernames: string[],
): Promise<void> => {
  const users = unsafelyUnwrap(await findUsers(usernames));

  for (const user of users) {
    const newAssignmentEventLogItems = user.eventLogItems.filter(
      (eventLogItem) => eventLogItem.action === EventLogAction.NEW_ASSIGNMENT,
    );
    expect(newAssignmentEventLogItems).toHaveLength(1);
  }

  const verifyResult = await verifyUserSignups();
  expect(verifyResult.ok).toBe(true);
};

interface AssertSecondRunChangesNothingParams {
  assignmentAlgorithm: AssignmentAlgorithm;
  assignmentTime: string;
  firstRunResults: readonly UserAssignmentResult[];
}

// The lottery for a start time happens once, so running it again lotteries nothing and leaves
// every spot the first run handed out where it is. Nothing here depends on which algorithm ran,
// so the per-algorithm suites share it.
export const assertSecondRunChangesNothing = async ({
  assignmentAlgorithm,
  assignmentTime,
  firstRunResults,
}: AssertSecondRunChangesNothingParams): Promise<void> => {
  const secondRunResults = unsafelyUnwrap(
    await runAssignment({ assignmentAlgorithm, assignmentTime }),
  );

  expect(secondRunResults.status).toEqual(
    AssignmentResultStatus.ALREADY_LOTTERIED,
  );
  expect(secondRunResults.results).toHaveLength(0);

  const firstRunWinners = firstRunResults.map((result) => result.username);
  const firstRunWinnerSet = new Set(firstRunWinners);

  // Same attendee, same program item, still exactly one spot each
  const signupsAfterSecondRun = unsafelyUnwrap(await findDirectSignups());
  const heldProgramItemsByWinner = new Map(
    signupsAfterSecondRun.flatMap((signup) =>
      signup.userSignups
        .filter((userSignup) => firstRunWinnerSet.has(userSignup.username))
        .map((userSignup) => [userSignup.username, signup.programItemId]),
    ),
  );
  expect(heldProgramItemsByWinner.size).toEqual(firstRunWinnerSet.size);
  for (const result of firstRunResults) {
    expect(heldProgramItemsByWinner.get(result.username)).toEqual(
      result.assignmentSignup.programItemId,
    );
  }

  // Prior winners still have exactly one assignment, not a second one
  await assertUserUpdatedCorrectly(firstRunWinners);

  await assertAssignmentInvariants(assignmentTime);
};

export const generateTestData = async (
  newUsersCount: number,
  newProgramItemsCount: number,
  groupSize: number,
  numberOfGroups: number,
  testUsersCount: number,
): Promise<void> => {
  await generateTestUsers(
    newUsersCount,
    groupSize,
    numberOfGroups,
    testUsersCount,
  );

  await createProgramItems(newProgramItemsCount);

  await createLotterySignups();
};

// Properties any valid assignment has, whatever the fixtures or the algorithm's shuffle produced.
// The generated data is 30 attendees in 10 groups across 10 program items, which is where these
// have something to catch that a handful of hand-built attendees cannot.
export const assertAssignmentInvariants = async (
  assignmentTime: string,
): Promise<void> => {
  const programItems = unsafelyUnwrap(await findProgramItems());
  const directSignups = unsafelyUnwrap(await findDirectSignups());
  const users = unsafelyUnwrap(await findUsers());

  const startingProgramItemIds = new Set(
    getStartingProgramItems(programItems, assignmentTime).map(
      (programItem) => programItem.programItemId,
    ),
  );

  const signupsForStartTime = directSignups.filter((directSignup) =>
    startingProgramItemIds.has(directSignup.programItemId),
  );

  // Nobody holds two spots at one start time
  const usernamesWithSpot = signupsForStartTime.flatMap((directSignup) =>
    directSignup.userSignups.map((userSignup) => userSignup.username),
  );
  expect(usernamesWithSpot).toHaveLength(new Set(usernamesWithSpot).size);

  for (const directSignup of signupsForStartTime) {
    const programItem = programItems.find(
      (found) => found.programItemId === directSignup.programItemId,
    );
    if (!programItem) {
      continue;
    }

    // Attendance limits hold, and count matches the attendees it tallies
    expect(directSignup.userSignups.length).toBeLessThanOrEqual(
      programItem.maxAttendance,
    );
    expect(directSignup.count).toEqual(directSignup.userSignups.length);
  }

  // A group is placed as a whole or not at all, and always into one program item: members
  // attend what their creator signed the group up for. Only spots the lottery handed out
  // count - a member keeping a first-come-first-served sign-up of their own while the group
  // goes unplaced is not a split, it is just their own sign-up standing.
  const placedProgramItemByUsername = new Map(
    signupsForStartTime.flatMap((directSignup) =>
      directSignup.userSignups
        .filter((userSignup) => userSignup.priority !== DIRECT_SIGNUP_PRIORITY)
        .map((userSignup) => [userSignup.username, directSignup.programItemId]),
    ),
  );
  const groupedUsers = groupBy(
    users.filter((user) => user.groupCode !== "0"),
    (user) => user.groupCode,
  );

  for (const groupMembers of Object.values(groupedUsers)) {
    const placements = groupMembers.map((groupMember) =>
      placedProgramItemByUsername.get(groupMember.username),
    );
    expect(new Set(placements).size).toEqual(1);
  }
};
