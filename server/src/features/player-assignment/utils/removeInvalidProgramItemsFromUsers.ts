import {
  findUsers,
  updateUsersByUsername,
} from "server/features/user/userRepository";
import { logger } from "server/utils/logger";
import { MongoDbError } from "shared/types/api/errors";
import { User } from "shared/types/models/user";
import {
  Result,
  isErrorResult,
  makeSuccessResult,
  unwrapResult,
} from "shared/utils/result";

export const removeInvalidProgramItemsFromUsers = async (): Promise<
  Result<void, MongoDbError>
> => {
  logger.info("Remove invalid games from users");

  const usersResult = await findUsers();
  if (isErrorResult(usersResult)) {
    return usersResult;
  }

  const users = unwrapResult(usersResult);

  const usersToUpdate: User[] = users.flatMap((user) => {
    const validLotterySignups = user.lotterySignups.filter((lotterySignup) => {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (lotterySignup.programItemDetails !== null) {
        return lotterySignup.programItemDetails;
      }
    });

    const changedLotterySignupsCount =
      user.lotterySignups.length - validLotterySignups.length;

    if (changedLotterySignupsCount > 0) {
      logger.info(
        `Remove ${changedLotterySignupsCount} invalid lotterySignups from user ${user.username}`,
      );
    }

    const validFavoritedGames = user.favoritedProgramItems.filter(
      (favoritedGame) => {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (favoritedGame !== null) {
          return favoritedGame;
        }
      },
    );

    const changedFavoritedGamesCount =
      user.favoritedProgramItems.length - validFavoritedGames.length;

    if (changedFavoritedGamesCount > 0) {
      logger.info(
        `Remove ${changedFavoritedGamesCount} invalid favoritedGames from user ${user.username}`,
      );
    }

    if (changedLotterySignupsCount > 0 || changedFavoritedGamesCount > 0) {
      return {
        ...user,
        lotterySignups: validLotterySignups,
        favoritedProgramItems: validFavoritedGames,
      };
    }

    return [];
  });

  const updateUsersResult = await updateUsersByUsername(usersToUpdate);
  if (isErrorResult(updateUsersResult)) {
    return updateUsersResult;
  }

  return makeSuccessResult(undefined);
};
