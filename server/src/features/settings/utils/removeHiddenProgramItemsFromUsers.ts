import { resetDirectSignupsByProgramItemIds } from "server/features/direct-signup/directSignupRepository";
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
  makeErrorResult,
  makeSuccessResult,
  unwrapResult,
} from "shared/utils/result";

export const removeHiddenProgramItemsFromUsers = async (
  hiddenProgramItemIds: readonly string[],
): Promise<Result<void, MongoDbError>> => {
  logger.info("Remove hidden program items from users");

  if (hiddenProgramItemIds.length === 0) {
    return makeErrorResult(MongoDbError.NO_HIDDEN_PROGRAM_ITEMS);
  }

  logger.info(`Found ${hiddenProgramItemIds.length} hidden program items`);

  const usersResult = await findUsers();
  if (isErrorResult(usersResult)) {
    return usersResult;
  }

  const users = unwrapResult(usersResult);

  const usersToUpdate: User[] = users.flatMap<User>((user) => {
    // Lottery signups to remove
    const lotterySignups = user.lotterySignups.filter((lotterySignup) => {
      const hiddenFound = hiddenProgramItemIds.find((hiddenProgramItemId) => {
        return hiddenProgramItemId === lotterySignup.programItemId;
      });
      if (!hiddenFound) {
        return lotterySignup;
      }
    });

    // Favorite program items to remove
    const favoriteProgramItemIds = user.favoriteProgramItemIds.filter(
      (favoriteProgramItemId) => {
        const hiddenFound = hiddenProgramItemIds.find((hiddenProgramItemId) => {
          return hiddenProgramItemId === favoriteProgramItemId;
        });
        if (!hiddenFound) {
          return favoriteProgramItemId;
        }
      },
    );

    if (
      user.lotterySignups.length !== lotterySignups.length ||
      user.favoriteProgramItemIds.length !== favoriteProgramItemIds.length
    ) {
      return {
        ...user,
        lotterySignups,
        favoriteProgramItemIds,
      };
    }
    return [];
  });

  const updateUsersResult = await updateUsersByUsername(usersToUpdate);
  if (isErrorResult(updateUsersResult)) {
    return updateUsersResult;
  }

  const resetSignupsByProgramItemIdsResult =
    await resetDirectSignupsByProgramItemIds(hiddenProgramItemIds);
  if (isErrorResult(resetSignupsByProgramItemIdsResult)) {
    return resetSignupsByProgramItemIdsResult;
  }

  logger.info(
    "Hidden program items removed from users and direct signups reset",
  );

  return makeSuccessResult();
};
