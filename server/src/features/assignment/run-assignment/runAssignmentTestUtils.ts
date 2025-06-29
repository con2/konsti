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
  isErrorResult,
  makeErrorResult,
  makeSuccessResult,
  unwrapResult,
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
  // User is group member, not group creators -> find group creator
  if (user.groupCode !== "0" && user.groupCode !== user.serial) {
    const groupCreator = users.find(
      (creator) => creator.groupCreatorCode === user.groupCode,
    );

    if (groupCreator) {
      return makeSuccessResult(groupCreator);
    }

    logger.error(
      "%s",
      new Error(`Group creator not found for user ${user.username}`),
    );

    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }

  // User is group creator
  return makeSuccessResult(user);
};

export const verifyUserSignups = async (): Promise<
  Result<void, MongoDbError>
> => {
  logger.info("Verify lottery signups and signups match for users");

  const usersResult = await findUsers();
  if (isErrorResult(usersResult)) {
    return usersResult;
  }
  const users = unwrapResult(usersResult);

  const signupsResult = await findDirectSignups();
  if (isErrorResult(signupsResult)) {
    return signupsResult;
  }
  const signups = unwrapResult(signupsResult);

  const programItemsResult = await findProgramItems();
  if (isErrorResult(programItemsResult)) {
    return programItemsResult;
  }
  const programItems = unwrapResult(programItemsResult);

  const lotteryParticipantDirectSignups = getLotteryParticipantDirectSignups(
    signups,
    programItems,
  );

  lotteryParticipantDirectSignups.map(({ programItemId, userSignups }) => {
    // Verify group member signups match with group creators lotterySignups
    // If not in group -> user is group creator

    userSignups.map((userSignup) => {
      const matchingUser = users.find(
        (user) => user.username === userSignup.username,
      );

      if (!matchingUser) {
        logger.error(
          "%s",
          new Error(`No matcing user: ${userSignup.username}`),
        );
        return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
      }

      const groupCreatorResult = getGroupCreator(users, matchingUser);
      if (isErrorResult(groupCreatorResult)) {
        return groupCreatorResult;
      }

      const groupCreator = unwrapResult(groupCreatorResult);

      const matchingCreatorLotterySignup = groupCreator.lotterySignups.find(
        (creatorLotterySignup) =>
          creatorLotterySignup.programItemId === programItemId &&
          dayjs(creatorLotterySignup.signedToStartTime).isSame(
            userSignup.signedToStartTime,
          ),
      );

      if (!matchingCreatorLotterySignup) {
        logger.error(
          "%s",
          new Error(
            `No matching signed program item found from group creator: ${userSignup.username} - ${programItemId}`,
          ),
        );
        return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
      }
    });
  });

  return makeSuccessResult();
};

export const assertUserUpdatedCorrectly = async (
  usernames: string[],
): Promise<void> => {
  const users = unsafelyUnwrap(await findUsers(usernames));

  users.map((user) => {
    const newAssignmentEventLogItems = user.eventLogItems.filter(
      (eventLogItem) => eventLogItem.action === EventLogAction.NEW_ASSIGNMENT,
    );
    expect(newAssignmentEventLogItems).toHaveLength(1);
  });

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
