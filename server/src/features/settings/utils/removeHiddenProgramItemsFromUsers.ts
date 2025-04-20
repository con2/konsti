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

  const usersToUpdate: User[] = users.flatMap<User>((user) => {
    const lotterySignups = user.lotterySignups.filter((lotterySignup) => {
      const hiddenFound = hiddenProgramItems.find((hiddenProgramItem) => {
        return (
          hiddenProgramItem.programItemId ===
          lotterySignup.programItem.programItemId
        );
      });
      if (!hiddenFound) {
        return lotterySignup;
      }
    });

    const favoriteProgramItemIds = user.favoriteProgramItemIds.filter(
      (favoriteProgramItemId) => {
        const hiddenFound = hiddenProgramItems.find((hiddenProgramItem) => {
          return hiddenProgramItem.programItemId === favoriteProgramItemId;
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

  const hiddenProgramItemIds = hiddenProgramItems.map(
    (hiddenProgramItem) => hiddenProgramItem.programItemId,
  );
  const resetSignupsByProgramItemIdsResult =
    await resetDirectSignupsByProgramItemIds(hiddenProgramItemIds);
  if (isErrorResult(resetSignupsByProgramItemIdsResult)) {
    return resetSignupsByProgramItemIdsResult;
  }

  logger.info(
    `Hidden program items removed from users and direct signups reset`,
  );

  return makeSuccessResult();
};
