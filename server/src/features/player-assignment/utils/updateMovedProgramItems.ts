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
  updatedGames: readonly ProgramItem[],
): Promise<Result<void, MongoDbError>> => {
  const currentGamesResult = await findProgramItems();
  if (isErrorResult(currentGamesResult)) {
    return currentGamesResult;
  }

  const currentGames = unwrapResult(currentGamesResult);
  const movedGames = currentGames.filter((currentGame) => {
    return updatedGames.find((updatedGame) => {
      return (
        currentGame.gameId === updatedGame.gameId &&
        dayjs(currentGame.startTime).toISOString() !==
          dayjs(updatedGame.startTime).toISOString()
      );
    });
  });

  if (movedGames.length === 0) {
    return makeSuccessResult(undefined);
  }

  logger.info(`Found ${movedGames.length} moved games`);

  // This will remove lottery signups
  const removeMovedLotterySignupsResult =
    await removeMovedLotterySignups(movedGames);
  if (isErrorResult(removeMovedLotterySignupsResult)) {
    return removeMovedLotterySignupsResult;
  }

  return makeSuccessResult(undefined);
};

const removeMovedLotterySignups = async (
  movedGames: readonly ProgramItem[],
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
      const movedFound = movedGames.find((movedGame) => {
        return movedGame.gameId === lotterySignup.gameDetails.gameId;
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
          .map((deletedGame) => deletedGame.gameId)
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

  return makeSuccessResult(undefined);
};
