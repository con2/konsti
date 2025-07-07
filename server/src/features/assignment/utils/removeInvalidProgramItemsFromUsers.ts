import dayjs from "dayjs";
import { partition, uniqueBy } from "remeda";
import { addEventLogItems } from "server/features/user/event-log/eventLogRepository";
import {
  findUsers,
  updateUsersByUsername,
} from "server/features/user/userRepository";
import { logger } from "server/utils/logger";
import { MongoDbError } from "shared/types/api/errors";
import { EventLogAction } from "shared/types/models/eventLog";
import { ProgramItem, State } from "shared/types/models/programItem";
import { FavoriteProgramItemId, LotterySignup } from "shared/types/models/user";
import {
  Result,
  isErrorResult,
  makeSuccessResult,
  unwrapResult,
} from "shared/utils/result";

export const removeCanceledDeletedProgramItemsFromUsers = async (
  programItems: readonly ProgramItem[],
): Promise<Result<void, MongoDbError>> => {
  logger.info("Remove invalid program items from users");

  const usersResult = await findUsers();
  if (isErrorResult(usersResult)) {
    return usersResult;
  }

  const usersToNofify: {
    username: string;
    invalidLotterySignups: LotterySignup[];
    invalidFavoriteProgramItemIds: FavoriteProgramItemId[];
  }[] = [];

  const users = unwrapResult(usersResult);

  const usersToUpdate = users.flatMap((user) => {
    // LOTTERY SIGNUPS

    const [validLotterySignups, invalidLotterySignups] = partition(
      user.lotterySignups,
      (lotterySignup) => {
        const foundProgramItem = programItems.find(
          (programItem) =>
            programItem.programItemId === lotterySignup.programItemId,
        );
        return foundProgramItem?.state === State.ACCEPTED;
      },
    );

    const changedLotterySignupsCount =
      user.lotterySignups.length - validLotterySignups.length;

    if (changedLotterySignupsCount > 0) {
      logger.info(
        `Remove ${changedLotterySignupsCount} canceled/removed lotterySignups from user ${user.username}`,
      );
    }

    // FAVORITES

    const [validFavoriteProgramItemIds, invalidFavoriteProgramItemIds] =
      partition(user.favoriteProgramItemIds, (favoriteProgramItemId) => {
        const foundProgramItem = programItems.find(
          (programItem) => programItem.programItemId === favoriteProgramItemId,
        );
        return foundProgramItem?.state === State.ACCEPTED;
      });

    const changedFavoriteProgramItemIdsCount =
      user.favoriteProgramItemIds.length - validFavoriteProgramItemIds.length;

    if (changedFavoriteProgramItemIdsCount > 0) {
      logger.info(
        `Remove ${changedFavoriteProgramItemIdsCount} canceled/removed favorite program items from user ${user.username}`,
      );
    }

    // UPDATES
    if (
      changedLotterySignupsCount > 0 ||
      changedFavoriteProgramItemIdsCount > 0
    ) {
      usersToNofify.push({
        username: user.username,
        invalidLotterySignups,
        invalidFavoriteProgramItemIds,
      });

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

  // Nofify users with canceled or deleted program items
  const eventUpdates = usersToNofify.flatMap((user) => {
    const lotteryUpdates = user.invalidLotterySignups.map((lotterySignup) => ({
      username: user.username,
      programItemId: lotterySignup.programItemId,
      programItemStartTime: lotterySignup.signedToStartTime,
      createdAt: dayjs().toISOString(),
    }));
    const favoriteUpdates = user.invalidFavoriteProgramItemIds.map(
      (favorite) => ({
        username: user.username,
        programItemId: favorite,
        programItemStartTime: dayjs().toISOString(),
        createdAt: dayjs().toISOString(),
      }),
    );
    return uniqueBy(
      [...lotteryUpdates, ...favoriteUpdates],
      (update) => update.programItemId,
    );
  });

  const addEventLogItemsResult = await addEventLogItems({
    action: EventLogAction.PROGRAM_ITEM_CANCELED,
    updates: eventUpdates,
  });
  if (isErrorResult(addEventLogItemsResult)) {
    return addEventLogItemsResult;
  }

  return makeSuccessResult();
};
