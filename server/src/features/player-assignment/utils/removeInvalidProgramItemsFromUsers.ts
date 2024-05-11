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
  logger.info("Remove invalid program items from users");

  const usersResult = await findUsers();
  if (isErrorResult(usersResult)) {
    return usersResult;
  }

  const users = unwrapResult(usersResult);

  const usersToUpdate: User[] = users.flatMap((user) => {
    const validLotterySignups = user.lotterySignups.filter((lotterySignup) => {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (lotterySignup.programItem !== null) {
        return lotterySignup.programItem;
      }
    });

    const changedLotterySignupsCount =
      user.lotterySignups.length - validLotterySignups.length;

    if (changedLotterySignupsCount > 0) {
      logger.info(
        `Remove ${changedLotterySignupsCount} invalid lotterySignups from user ${user.username}`,
      );
    }

    const validFavoritedProgramItems = user.favoritedProgramItems.filter(
      (favoritedProgramItem) => {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (favoritedProgramItem !== null) {
          return favoritedProgramItem;
        }
      },
    );

    const changedFavoritedProgramItemsCount =
      user.favoritedProgramItems.length - validFavoritedProgramItems.length;

    if (changedFavoritedProgramItemsCount > 0) {
      logger.info(
        `Remove ${changedFavoritedProgramItemsCount} invalid favoritedProgramItems from user ${user.username}`,
      );
    }

    if (
      changedLotterySignupsCount > 0 ||
      changedFavoritedProgramItemsCount > 0
    ) {
      return {
        ...user,
        lotterySignups: validLotterySignups,
        favoritedProgramItems: validFavoritedProgramItems,
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
