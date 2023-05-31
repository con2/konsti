import {
  findUsers,
  updateUserByUsername,
} from "server/features/user/userRepository";
import { logger } from "server/utils/logger";
import { MongoDbError } from "shared/typings/api/errors";
import {
  AsyncResult,
  isErrorResult,
  makeErrorResult,
  makeSuccessResult,
  unwrapResult,
} from "shared/utils/asyncResult";

export const removeInvalidGamesFromUsers = async (): Promise<
  AsyncResult<void, MongoDbError>
> => {
  logger.info("Remove invalid games from users");

  const usersAsyncResult = await findUsers();
  if (isErrorResult(usersAsyncResult)) {
    return usersAsyncResult;
  }

  const users = unwrapResult(usersAsyncResult);

  const promises = users.map(async (user) => {
    const validSignedGames = user.signedGames.filter((signedGame) => {
      if (signedGame.gameDetails !== null) {
        return signedGame.gameDetails;
      }
    });

    const changedSignedGamesCount =
      user.signedGames.length - validSignedGames.length;

    if (changedSignedGamesCount > 0) {
      logger.info(
        `Remove ${changedSignedGamesCount} invalid signedGames from user ${user.username}`
      );
    }

    const validFavoritedGames = user.favoritedGames.filter((favoritedGame) => {
      if (favoritedGame !== null) {
        return favoritedGame;
      }
    });

    const changedFavoritedGamesCount =
      user.favoritedGames.length - validFavoritedGames.length;

    if (changedFavoritedGamesCount > 0) {
      logger.info(
        `Remove ${changedFavoritedGamesCount} invalid favoritedGames from user ${user.username}`
      );
    }

    if (changedSignedGamesCount > 0 || changedFavoritedGamesCount > 0) {
      const updateUserByUsernameAsyncResult = await updateUserByUsername({
        ...user,
        signedGames: validSignedGames,
        favoritedGames: validFavoritedGames,
      });
      if (isErrorResult(updateUserByUsernameAsyncResult)) {
        return updateUserByUsernameAsyncResult;
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
