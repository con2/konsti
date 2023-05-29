import { delSignupsByGameIds } from "server/features/signup/signupRepository";
import {
  findUsers,
  updateUserByUsername,
} from "server/features/user/userRepository";
import { logger } from "server/utils/logger";
import { MongoDbError } from "shared/typings/api/errors";
import { Game } from "shared/typings/models/game";
import {
  AsyncResult,
  isErrorResult,
  makeErrorResult,
  makeSuccessResult,
  unwrapResult,
} from "shared/utils/asyncResult";

export const removeHiddenGamesFromUsers = async (
  hiddenGames: readonly Game[]
): Promise<AsyncResult<void, MongoDbError>> => {
  logger.info(`Remove hidden games from users`);

  if (!hiddenGames || hiddenGames.length === 0) {
    return makeErrorResult(MongoDbError.NO_HIDDEN_GAMES);
  }

  logger.info(`Found ${hiddenGames.length} hidden games`);

  const usersAsyncResult = await findUsers();
  if (isErrorResult(usersAsyncResult)) {
    return usersAsyncResult;
  }

  const users = unwrapResult(usersAsyncResult);

  const userPromises = users.map(async (user) => {
    const signedGames = user.signedGames.filter((signedGame) => {
      const hiddenFound = hiddenGames.find((hiddenGame) => {
        return hiddenGame.gameId === signedGame.gameDetails.gameId;
      });
      if (!hiddenFound) {
        return signedGame;
      }
    });

    const favoritedGames = user.favoritedGames.filter((favoritedGame) => {
      const hiddenFound = hiddenGames.find((hiddenGame) => {
        return hiddenGame.gameId === favoritedGame.gameId;
      });
      if (!hiddenFound) {
        return favoritedGame;
      }
    });

    if (
      user.signedGames.length !== signedGames.length ||
      user.favoritedGames.length !== favoritedGames.length
    ) {
      await updateUserByUsername({
        ...user,
        signedGames,
        favoritedGames,
      });
    }
  });

  try {
    await Promise.all(userPromises);
  } catch (error) {
    logger.error(`updateUser error: ${error}`);
  }

  const hiddenGameIds = hiddenGames.map((hiddenGame) => hiddenGame.gameId);
  try {
    await delSignupsByGameIds(hiddenGameIds);
  } catch (error) {
    logger.error(`delSignupsByGameIds error: ${error}`);
  }

  logger.info(`Hidden games removed from users`);

  return makeSuccessResult(undefined);
};
