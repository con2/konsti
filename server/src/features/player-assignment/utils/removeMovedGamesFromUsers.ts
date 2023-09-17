import dayjs from "dayjs";
import { logger } from "server/utils/logger";
import { Game } from "shared/typings/models/game";
import { findGames } from "server/features/game/gameRepository";
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
import { MongoDbError } from "shared/typings/api/errors";
import { User } from "shared/typings/models/user";

export const removeMovedGamesFromUsers = async (
  updatedGames: readonly Game[],
): Promise<Result<void, MongoDbError>> => {
  logger.info("Remove moved signed games from users");

  const currentGamesResult = await findGames();
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

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!movedGames || movedGames.length === 0) {
    return makeSuccessResult(undefined);
  }

  logger.info(`Found ${movedGames.length} moved games`);

  const usersResult = await findUsers();
  if (isErrorResult(usersResult)) {
    return usersResult;
  }

  const users = unwrapResult(usersResult);

  const usersToUpdate: User[] = users.flatMap((user) => {
    const programItemsToBeRemoved: Game[] = [];

    const signedGames = user.signedGames.filter((signedGame) => {
      const movedFound = movedGames.find((movedGame) => {
        return movedGame.gameId === signedGame.gameDetails.gameId;
      });
      if (!movedFound) {
        return signedGame;
      }
      programItemsToBeRemoved.push(movedFound);
    });

    if (programItemsToBeRemoved.length > 0) {
      logger.info(
        `Remove following moved signedGames from user ${
          user.username
        }: ${programItemsToBeRemoved
          .map((deletedGame) => deletedGame.gameId)
          .join(", ")}`,
      );
    }

    if (user.signedGames.length !== signedGames.length) {
      return {
        ...user,
        signedGames,
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
