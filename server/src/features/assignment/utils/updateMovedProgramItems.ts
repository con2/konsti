import dayjs from "dayjs";
import { logger } from "server/utils/logger";
import { ProgramItem } from "shared/types/models/programItem";
import { findUsers } from "server/features/user/userRepository";
import {
  Result,
  isErrorResult,
  makeSuccessResult,
  unwrapResult,
} from "shared/utils/result";
import { MongoDbError } from "shared/types/api/errors";
import { delLotterySignups } from "server/features/user/lottery-signup/lotterySignupRepository";

export const updateMovedProgramItems = async (
  updatedProgramItems: readonly ProgramItem[],
  currentProgramItems: readonly ProgramItem[],
): Promise<Result<void, MongoDbError>> => {
  const movedProgramItems = currentProgramItems.filter((currentProgramItem) => {
    return updatedProgramItems.find((updatedProgramItem) => {
      return (
        currentProgramItem.programItemId === updatedProgramItem.programItemId &&
        dayjs(currentProgramItem.startTime).toISOString() !==
          dayjs(updatedProgramItem.startTime).toISOString()
      );
    });
  });

  if (movedProgramItems.length === 0) {
    return makeSuccessResult();
  }

  logger.info(`Found ${movedProgramItems.length} moved program items`);

  // This will remove lottery signups
  const removeMovedLotterySignupsResult =
    await removeMovedLotterySignups(movedProgramItems);
  if (isErrorResult(removeMovedLotterySignupsResult)) {
    return removeMovedLotterySignupsResult;
  }

  return makeSuccessResult();
};

const removeMovedLotterySignups = async (
  movedProgramItems: readonly ProgramItem[],
): Promise<Result<void, MongoDbError>> => {
  logger.info("Remove moved lottery signups from users");

  const usersResult = await findUsers();
  if (isErrorResult(usersResult)) {
    return usersResult;
  }

  const users = unwrapResult(usersResult);

  const usersToUpdate = users.flatMap((user) => {
    const movedLotterySignups = user.lotterySignups.filter((lotterySignup) => {
      const movedFound = movedProgramItems.find((movedProgramItem) => {
        return movedProgramItem.programItemId === lotterySignup.programItemId;
      });
      if (movedFound) {
        return lotterySignup;
      }
    });

    if (movedLotterySignups.length === 0) {
      return [];
    }

    const lotterySignupProgramItemIds = movedLotterySignups.map(
      (lotterySignup) => lotterySignup.programItemId,
    );

    logger.info(
      `Remove following moved lotterySignups from user ${
        user.username
      }: ${lotterySignupProgramItemIds.join(", ")}`,
    );

    return {
      username: user.username,
      lotterySignupProgramItemIds,
    };
  });

  const delLotterySignupsResult = await delLotterySignups(usersToUpdate);
  if (isErrorResult(delLotterySignupsResult)) {
    return delLotterySignupsResult;
  }

  return makeSuccessResult();
};
