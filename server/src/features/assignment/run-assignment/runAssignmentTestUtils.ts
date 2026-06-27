import { expect } from "vitest";
import dayjs from "dayjs";
import { unsafelyUnwrap } from "server/test/utils/unsafelyUnwrapResult";
import { EventLogAction } from "shared/types/models/eventLog";
import { logger } from "server/utils/logger";
import { User } from "shared/types/models/user";
import { findUsers } from "server/features/user/userRepository";
import { findDirectSignups } from "server/features/direct-signup/directSignupRepository";
import {
  Result,
  makeErrorResult,
  makeSuccessResult,
} from "shared/utils/result";
import { MongoDbError } from "shared/types/api/errors";
import { findProgramItems } from "server/features/program-item/programItemRepository";
import { getLotteryParticipantDirectSignups } from "server/features/assignment/utils/prepareAssignmentParams";
import { generateTestUsers } from "server/test/test-data-generation/generators/generateTestData";
import { createProgramItems } from "server/test/test-data-generation/generators/createProgramItems";
import { createLotterySignups } from "server/test/test-data-generation/generators/createLotterySignups";

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

  for (const {
    programItemId,
    userSignups,
  } of lotteryParticipantDirectSignups) {
    // Verify group member signups match with group creators lotterySignups
    // If not in group -> user is group creator

    for (const userSignup of userSignups) {
      const matchingUser = users.find(
        (user) => user.username === userSignup.username,
      );

      if (!matchingUser) {
        logger.error(new Error(`No matcing user: ${userSignup.username}`));
        continue;
      }

      const groupCreatorResult = getGroupCreator(users, matchingUser);
      if (!groupCreatorResult.ok) {
        continue;
      }

      const groupCreator = groupCreatorResult.value;

      const matchingCreatorLotterySignup = groupCreator.lotterySignups.some(
        (creatorLotterySignup) =>
          creatorLotterySignup.programItemId === programItemId &&
          dayjs(creatorLotterySignup.signedToStartTime).isSame(
            userSignup.signedToStartTime,
          ),
      );

      if (!matchingCreatorLotterySignup) {
        logger.error(
          new Error(
            `No matching signed program item found from group creator: ${userSignup.username} - ${programItemId}`,
          ),
        );
      }
    }
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

  await verifyUserSignups();
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
