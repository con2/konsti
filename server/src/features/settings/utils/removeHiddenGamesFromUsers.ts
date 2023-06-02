import { delSignupsByGameIds } from "server/features/signup/signupRepository";
import {
  findUsers,
  updateUserByUsername,
} from "server/features/user/userRepository";
import { logger } from "server/utils/logger";
import { MongoDbError } from "shared/typings/api/errors";
import { Game } from "shared/typings/models/game";
import {
  Result,
  isErrorResult,
  makeErrorResult,
  makeSuccessResult,
  unwrapResult,
} from "shared/utils/result";

export const removeHiddenGamesFromUsers = async (
  hiddenGames: readonly Game[]
): Promise<Result<void, MongoDbError>> => {
  logger.info(`Remove hidden games from users`);

  if (!hiddenGames || hiddenGames.length === 0) {
    return makeErrorResult(MongoDbError.NO_HIDDEN_GAMES);
  }

  logger.info(`Found ${hiddenGames.length} hidden games`);

  const usersResult = await findUsers();
  if (isErrorResult(usersResult)) {
    return usersResult;
  }

  const users = unwrapResult(usersResult);

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
      const updateUserByUsernameResult = await updateUserByUsername({
        ...user,
        signedGames,
        favoritedGames,
      });
      if (isErrorResult(updateUserByUsernameResult)) {
        return updateUserByUsernameResult;
      }
    }

    return makeSuccessResult(undefined);
  });

  const results = await Promise.all(userPromises);
  const someUpdateFailed = results.some((result) => isErrorResult(result));
  if (someUpdateFailed) {
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }

  const hiddenGameIds = hiddenGames.map((hiddenGame) => hiddenGame.gameId);
  const delSignupsByGameIdsResult = await delSignupsByGameIds(hiddenGameIds);
  if (isErrorResult(delSignupsByGameIdsResult)) {
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }

  logger.info(`Hidden games removed from users`);

  return makeSuccessResult(undefined);
};
