import { resetSignupsByGameIds } from "server/features/signup/signupRepository";
import {
  findUsers,
  updateUsersByUsername,
} from "server/features/user/userRepository";
import { logger } from "server/utils/logger";
import { MongoDbError } from "shared/typings/api/errors";
import { Game } from "shared/typings/models/game";
import { User } from "shared/typings/models/user";
import {
  Result,
  isErrorResult,
  makeErrorResult,
  makeSuccessResult,
  unwrapResult,
} from "shared/utils/result";

export const removeHiddenGamesFromUsers = async (
  hiddenGames: readonly Game[],
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

  const usersToUpdate: User[] = users.flatMap((user) => {
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
      return {
        ...user,
        signedGames,
        favoritedGames,
      };
    }
    return [];
  });

  const updateUsersResult = await updateUsersByUsername(usersToUpdate);
  if (isErrorResult(updateUsersResult)) {
    return updateUsersResult;
  }

  const hiddenGameIds = hiddenGames.map((hiddenGame) => hiddenGame.gameId);
  const resetSignupsByGameIdsResult = await resetSignupsByGameIds(
    hiddenGameIds,
  );
  if (isErrorResult(resetSignupsByGameIdsResult)) {
    return resetSignupsByGameIdsResult;
  }

  logger.info(`Hidden games removed from users and signups reset`);

  return makeSuccessResult(undefined);
};
