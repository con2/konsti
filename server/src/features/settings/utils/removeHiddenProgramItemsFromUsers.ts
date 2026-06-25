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
  makeErrorResult,
  makeSuccessResult,
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
  if (!usersResult.ok) {
    return usersResult;
  }

  const usersToUpdate: User[] = usersResult.value.flatMap<User>((user) => {
    // Lottery signups to remove
    const lotterySignups = user.lotterySignups.filter(
      (lotterySignup) =>
        !hiddenProgramItemIds.includes(lotterySignup.programItemId),
    );

    // Favorite program items to remove
    const favoriteProgramItemIds = user.favoriteProgramItemIds.filter(
      (favoriteProgramItemId) =>
        !hiddenProgramItemIds.includes(favoriteProgramItemId),
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
  if (!updateUsersResult.ok) {
    return updateUsersResult;
  }

  const resetSignupsByProgramItemIdsResult =
    await resetDirectSignupsByProgramItemIds(hiddenProgramItemIds);
  if (!resetSignupsByProgramItemIdsResult.ok) {
    return resetSignupsByProgramItemIdsResult;
  }

  logger.info(
    "Hidden program items removed from users and direct signups reset",
  );

  return makeSuccessResult();
};
