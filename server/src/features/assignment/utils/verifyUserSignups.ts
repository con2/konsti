import dayjs from "dayjs";
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
import { getLotteryValidDirectSignups } from "server/features/assignment/utils/prepareAssignmentParams";

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

  const lotteryValidDirectSignups = getLotteryValidDirectSignups(
    signups,
    programItems,
  );

  lotteryValidDirectSignups.map(({ programItemId, userSignups }) => {
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
