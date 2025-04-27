import dayjs from "dayjs";
import { logger } from "server/utils/logger";
import { ProgramItem } from "shared/types/models/programItem";
import { findProgramItems } from "server/features/program-item/programItemRepository";
import {
  findUsers,
  updateUsersByUsername,
} from "server/features/user/userRepository";
import {
  Result,
  isErrorResult,
  makeSuccessResult,
  unwrapResult,
} from "shared/utils/result";
import { MongoDbError } from "shared/types/api/errors";
import { User } from "shared/types/models/user";

export const updateMovedProgramItems = async (
  updatedProgramItems: readonly ProgramItem[],
): Promise<Result<void, MongoDbError>> => {
  const currentProgramItemsResult = await findProgramItems();
  if (isErrorResult(currentProgramItemsResult)) {
    return currentProgramItemsResult;
  }

  const currentProgramItems = unwrapResult(currentProgramItemsResult);
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

  const usersToUpdate: User[] = users.flatMap((user) => {
    const programItemsToBeRemoved: ProgramItem[] = [];

    const lotterySignups = user.lotterySignups.filter((lotterySignup) => {
      const movedFound = movedProgramItems.find((movedProgramItem) => {
        return movedProgramItem.programItemId === lotterySignup.programItemId;
      });
      if (!movedFound) {
        return lotterySignup;
      }
      programItemsToBeRemoved.push(movedFound);
    });

    if (programItemsToBeRemoved.length > 0) {
      logger.info(
        `Remove following moved lotterySignups from user ${
          user.username
        }: ${programItemsToBeRemoved
          .map((deletedProgramItem) => deletedProgramItem.programItemId)
          .join(", ")}`,
      );
    }

    if (user.lotterySignups.length !== lotterySignups.length) {
      return {
        ...user,
        lotterySignups,
      };
    }

    return [];
  });

  // TODO: Remove moved program items instead of updating all
  const updateUsersResult = await updateUsersByUsername(usersToUpdate);
  if (isErrorResult(updateUsersResult)) {
    return updateUsersResult;
  }

  return makeSuccessResult();
};
