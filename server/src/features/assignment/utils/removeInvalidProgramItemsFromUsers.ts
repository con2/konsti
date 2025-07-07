import {
  findUsers,
  updateUsersByUsername,
} from "server/features/user/userRepository";
import { logger } from "server/utils/logger";
import { MongoDbError } from "shared/types/api/errors";
import { ProgramItem, State } from "shared/types/models/programItem";
import { User } from "shared/types/models/user";
import {
  Result,
  isErrorResult,
  makeSuccessResult,
  unwrapResult,
} from "shared/utils/result";

export const removeInvalidProgramItemsFromUsers = async (
  programItems: readonly ProgramItem[],
): Promise<Result<void, MongoDbError>> => {
  logger.info("Remove invalid program items from users");

  const usersResult = await findUsers();
  if (isErrorResult(usersResult)) {
    return usersResult;
  }

  const users = unwrapResult(usersResult);

  const usersToUpdate: User[] = users.flatMap<User>((user) => {
    const validLotterySignups = user.lotterySignups.filter((lotterySignup) => {
      const foundProgramItem = programItems.find(
        (programItem) =>
          programItem.programItemId === lotterySignup.programItemId,
      );
      if (foundProgramItem && foundProgramItem.state === State.ACCEPTED) {
        return lotterySignup;
      }
    });

    const changedLotterySignupsCount =
      user.lotterySignups.length - validLotterySignups.length;

    if (changedLotterySignupsCount > 0) {
      logger.info(
        `Remove ${changedLotterySignupsCount} invalid lotterySignups from user ${user.username}`,
      );
    }

    const validFavoriteProgramItemIds = user.favoriteProgramItemIds.filter(
      (favoriteProgramItemId) => {
        const foundProgramItem = programItems.find(
          (programItem) => programItem.programItemId === favoriteProgramItemId,
        );
        if (foundProgramItem && foundProgramItem.state === State.ACCEPTED) {
          return favoriteProgramItemId;
        }
      },
    );

    const changedFavoriteProgramItemIdsCount =
      user.favoriteProgramItemIds.length - validFavoriteProgramItemIds.length;

    if (changedFavoriteProgramItemIdsCount > 0) {
      logger.info(
        `Remove ${changedFavoriteProgramItemIdsCount} invalid favorite program items from user ${user.username}`,
      );
    }

    if (
      changedLotterySignupsCount > 0 ||
      changedFavoriteProgramItemIdsCount > 0
    ) {
      return {
        ...user,
        lotterySignups: validLotterySignups,
        favoriteProgramItemIds: validFavoriteProgramItemIds,
      };
    }

    return [];
  });

  const updateUsersResult = await updateUsersByUsername(usersToUpdate);
  if (isErrorResult(updateUsersResult)) {
    return updateUsersResult;
  }

  return makeSuccessResult();
};
