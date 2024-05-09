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

export const removeHiddenProgramItemsFromUsers = async (
  hiddenProgramItems: readonly ProgramItem[],
): Promise<Result<void, MongoDbError>> => {
  logger.info(`Remove hidden program items from users`);

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!hiddenProgramItems || hiddenProgramItems.length === 0) {
    return makeErrorResult(MongoDbError.NO_HIDDEN_PROGRAM_ITEMS);
  }

  logger.info(`Found ${hiddenProgramItems.length} hidden program items`);

  const usersResult = await findUsers();
  if (isErrorResult(usersResult)) {
    return usersResult;
  }

  const users = unwrapResult(usersResult);

  const usersToUpdate: User[] = users.flatMap((user) => {
    const lotterySignups = user.lotterySignups.filter((lotterySignup) => {
      const hiddenFound = hiddenProgramItems.find((hiddenProgramItem) => {
        return (
          hiddenProgramItem.programItemId ===
          lotterySignup.programItemDetails.programItemId
        );
      });
      if (!hiddenFound) {
        return lotterySignup;
      }
    });

    const favoritedProgramItems = user.favoritedProgramItems.filter(
      (favoritedProgramItem) => {
        const hiddenFound = hiddenProgramItems.find((hiddenProgramItem) => {
          return (
            hiddenProgramItem.programItemId ===
            favoritedProgramItem.programItemId
          );
        });
        if (!hiddenFound) {
          return favoritedProgramItem;
        }
      },
    );

    if (
      user.lotterySignups.length !== lotterySignups.length ||
      user.favoritedProgramItems.length !== favoritedProgramItems.length
    ) {
      return {
        ...user,
        lotterySignups,
        favoritedProgramItems,
      };
    }
    return [];
  });

  const updateUsersResult = await updateUsersByUsername(usersToUpdate);
  if (isErrorResult(updateUsersResult)) {
    return updateUsersResult;
  }

  const hiddenProgramItemIds = hiddenProgramItems.map(
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
