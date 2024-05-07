import { resetDirectSignupsByGameIds } from "server/features/direct-signup/directSignupRepository";
import {
  findUsers,
  updateUsersByUsername,
} from "server/features/user/userRepository";
import { logger } from "server/utils/logger";
import { MongoDbError } from "shared/types/api/errors";
import { Game } from "shared/types/models/game";
import { User } from "shared/types/models/user";
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

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
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
    const lotterySignups = user.lotterySignups.filter((lotterySignup) => {
      const hiddenFound = hiddenGames.find((hiddenGame) => {
        return hiddenGame.gameId === lotterySignup.gameDetails.gameId;
      });
      if (!hiddenFound) {
        return lotterySignup;
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
      user.lotterySignups.length !== lotterySignups.length ||
      user.favoritedGames.length !== favoritedGames.length
    ) {
      return {
        ...user,
        lotterySignups,
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
  const resetSignupsByGameIdsResult =
    await resetDirectSignupsByGameIds(hiddenGameIds);
  if (isErrorResult(resetSignupsByGameIdsResult)) {
    return resetSignupsByGameIdsResult;
  }

  logger.info(`Hidden games removed from users and signups reset`);

  return makeSuccessResult(undefined);
};
