import dayjs from "dayjs";
import { logger } from "server/utils/logger";
import { Game } from "shared/typings/models/game";
import { findGames } from "server/features/game/gameRepository";
import {
  findUsers,
  updateUserByUsername,
} from "server/features/user/userRepository";
import {
  AsyncResult,
  isErrorResult,
  makeErrorResult,
  makeSuccessResult,
  unwrapResult,
} from "shared/utils/asyncResult";
import { MongoDbError } from "shared/typings/api/errors";

export const removeMovedGamesFromUsers = async (
  updatedGames: readonly Game[]
): Promise<AsyncResult<void, MongoDbError>> => {
  logger.info("Remove moved signed games from users");

  const currentGamesAsyncResult = await findGames();

  if (isErrorResult(currentGamesAsyncResult)) {
    return currentGamesAsyncResult;
  }

  const currentGames = unwrapResult(currentGamesAsyncResult);
  const movedGames = currentGames.filter((currentGame) => {
    return updatedGames.find((updatedGame) => {
      return (
        currentGame.gameId === updatedGame.gameId &&
        dayjs(currentGame.startTime).format() !==
          dayjs(updatedGame.startTime).format()
      );
    });
  });

  if (!movedGames || movedGames.length === 0) {
    return makeSuccessResult(undefined);
  }

  logger.info(`Found ${movedGames.length} moved games`);

  let users;
  try {
    users = await findUsers();
  } catch (error) {
    logger.error(`findUsers error: ${error}`);
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }

  const promises = users.map(async (user) => {
    const signedGames = user.signedGames.filter((signedGame) => {
      const movedFound = movedGames.find((movedGame) => {
        return movedGame.gameId === signedGame.gameDetails.gameId;
      });
      if (!movedFound) {
        return signedGame;
      }
    });

    if (signedGames.length > 0) {
      logger.info(
        `Remove following moved signedGames from user ${
          user.username
        }: ${signedGames
          .map((signedGame) => signedGame.gameDetails.gameId)
          .join(", ")}`
      );
    }

    if (user.signedGames.length !== signedGames.length) {
      await updateUserByUsername({
        ...user,
        signedGames,
      });
    }
  });

  try {
    await Promise.all(promises);
    return makeSuccessResult(undefined);
  } catch (error) {
    logger.error(`updateUser error: ${error}`);
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};
