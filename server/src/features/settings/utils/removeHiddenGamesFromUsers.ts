import { resetDirectSignupsByProgramItemIds } from "server/features/direct-signup/directSignupRepository";
import {
  findUsers,
  updateUsersByUsername,
} from "server/features/user/userRepository";
import { logger } from "server/utils/logger";
import { MongoDbError } from "shared/types/api/errors";
import { ProgramItem } from "shared/types/models/programItem";
import { User } from "shared/types/models/user";
import {
  Result,
  isErrorResult,
  makeErrorResult,
  makeSuccessResult,
  unwrapResult,
} from "shared/utils/result";

export const removeHiddenGamesFromUsers = async (
  hiddenGames: readonly ProgramItem[],
): Promise<Result<void, MongoDbError>> => {
  logger.info(`Remove hidden games from users`);

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!hiddenGames || hiddenGames.length === 0) {
    return makeErrorResult(MongoDbError.NO_HIDDEN_PROGRAM_ITEMS);
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
        return (
          hiddenGame.programItemId ===
          lotterySignup.programItemDetails.programItemId
        );
      });
      if (!hiddenFound) {
        return lotterySignup;
      }
    });

    const favoritedGames = user.favoritedGames.filter((favoritedGame) => {
      const hiddenFound = hiddenGames.find((hiddenGame) => {
        return hiddenGame.programItemId === favoritedGame.programItemId;
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

  const hiddenProgramItemIds = hiddenGames.map(
    (hiddenGame) => hiddenGame.programItemId,
  );
  const resetSignupsByProgramItemIdsResult =
    await resetDirectSignupsByProgramItemIds(hiddenProgramItemIds);
  if (isErrorResult(resetSignupsByProgramItemIdsResult)) {
    return resetSignupsByProgramItemIdsResult;
  }

  logger.info(
    `Hidden program items removed from users and direct signups reset`,
  );

  return makeSuccessResult(undefined);
};
