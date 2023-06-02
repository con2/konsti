import dayjs from "dayjs";
import { logger } from "server/utils/logger";
import { Game } from "shared/typings/models/game";
import { findGames } from "server/features/game/gameRepository";
import {
  findUsers,
  updateUserByUsername,
} from "server/features/user/userRepository";
import {
  Result,
  isErrorResult,
  makeErrorResult,
  makeSuccessResult,
  unwrapResult,
} from "shared/utils/result";
import { MongoDbError } from "shared/typings/api/errors";

export const removeMovedGamesFromUsers = async (
  updatedGames: readonly Game[]
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
        dayjs(currentGame.startTime).format() !==
          dayjs(updatedGame.startTime).format()
      );
    });
  });

  if (!movedGames || movedGames.length === 0) {
    return makeSuccessResult(undefined);
  }

  logger.info(`Found ${movedGames.length} moved games`);

  const usersResult = await findUsers();
  if (isErrorResult(usersResult)) {
    return usersResult;
  }

  const users = unwrapResult(usersResult);

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
      const updateUserByUsernameResult = await updateUserByUsername({
        ...user,
        signedGames,
      });
      if (isErrorResult(updateUserByUsernameResult)) {
        return updateUserByUsernameResult;
      }
    }

    return makeSuccessResult(undefined);
  });

  const results = await Promise.all(promises);
  const someUpdateFailed = results.some((result) => isErrorResult(result));
  if (someUpdateFailed) {
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }

  return makeSuccessResult(undefined);
};
