import dayjs from "dayjs";
import { logger } from "server/utils/logger";
import { User } from "shared/types/models/user";
import { findUsers } from "server/features/user/userRepository";
import { findDirectSignups } from "server/features/direct-signup/directSignupRepository";
import { config } from "shared/config";
import {
  Result,
  isErrorResult,
  makeErrorResult,
  makeSuccessResult,
  unwrapResult,
} from "shared/utils/result";
import { MongoDbError } from "shared/types/api/errors";

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

  signups.map(({ programItem, userSignups }) => {
    if (
      !config
        .event()
        .twoPhaseSignupProgramTypes.includes(programItem.programType) ||
      config
        .event()
        .directSignupAlwaysOpenIds.includes(programItem.programItemId)
    ) {
      return;
    }

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
          creatorLotterySignup.programItem.programItemId ===
            programItem.programItemId &&
          dayjs(creatorLotterySignup.time).isSame(userSignup.time),
      );

      if (!matchingCreatorLotterySignup) {
        logger.error(
          "%s",
          new Error(
            `No matching signed program item found from group creator: ${userSignup.username} - ${programItem.title}`,
          ),
        );
        return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
      }
    });
  });

  return makeSuccessResult(undefined);
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
