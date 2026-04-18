import dayjs from "dayjs";
import { partition, uniqueBy } from "remeda";
import { DirectSignupsForProgramItem } from "server/features/direct-signup/directSignupTypes";
import { addEventLogItems } from "server/features/user/event-log/eventLogRepository";
import {
  findUsers,
  updateUsersByUsername,
} from "server/features/user/userRepository";
import { logger } from "server/utils/logger";
import { MongoDbError } from "shared/types/api/errors";
import { EventLogAction } from "shared/types/models/eventLog";
import {
  ProgramItem,
  SignupType,
  State,
} from "shared/types/models/programItem";
import { FavoriteProgramItemId, LotterySignup } from "shared/types/models/user";
import {
  Result,
  isErrorResult,
  makeSuccessResult,
  unwrapResult,
} from "shared/utils/result";
import { getTimeNow } from "server/features/assignment/utils/getTimeNow";
import { getLotterySignupEndTime } from "shared/utils/signupTimes";
import { isLotterySignupProgramItem } from "shared/utils/isLotterySignupProgramItem";

interface UserToNofify {
  username: string;
  invalidLotterySignups: LotterySignup[];
  invalidFavoriteProgramItemIds: FavoriteProgramItemId[];
}

interface RemoveCanceledDeletedProgramItemsFromUsersParams {
  programItems: readonly ProgramItem[];
  notifyAffectedDirectSignups: DirectSignupsForProgramItem[];
  notify: boolean;
}

export const removeCanceledDeletedProgramItemsFromUsers = async ({
  programItems,
  notifyAffectedDirectSignups,
  notify,
}: RemoveCanceledDeletedProgramItemsFromUsersParams): Promise<
  Result<void, MongoDbError>
> => {
  logger.info("Remove invalid program items from users");

  const timeNowResult = await getTimeNow();
  if (isErrorResult(timeNowResult)) {
    return timeNowResult;
  }
  const timeNow = unwrapResult(timeNowResult);

  const usersResult = await findUsers();
  if (isErrorResult(usersResult)) {
    return usersResult;
  }

  const usersToNofify: UserToNofify[] = [];

  const users = unwrapResult(usersResult);

  const usersToUpdate = users.flatMap((user) => {
    // LOTTERY SIGNUPS

    const [keepLotterySignups, removeLotterySignups] = partition(
      user.lotterySignups,
      (lotterySignup) => {
        const foundProgramItem = programItems.find(
          (programItem) =>
            programItem.programItemId === lotterySignup.programItemId,
        );

        const isValid =
          foundProgramItem?.state === State.ACCEPTED &&
          foundProgramItem.signupType === SignupType.KONSTI &&
          isLotterySignupProgramItem(foundProgramItem);

        if (isValid) {
          return true;
        }

        // Preserve already-run lottery signups when the item still exists (cancelled or signupType changed)
        // Deleted items (not in programItems) are always removed
        if (foundProgramItem) {
          const lotteryHasRun = !timeNow.isBefore(
            getLotterySignupEndTime(foundProgramItem),
          );
          if (lotteryHasRun) {
            return true;
          }
        }

        return false;
      },
    );

    const changedLotterySignupsCount =
      user.lotterySignups.length - keepLotterySignups.length;

    if (changedLotterySignupsCount > 0) {
      logger.info(
        `Remove ${changedLotterySignupsCount} canceled/removed lotterySignups from user ${user.username}`,
      );
    }

    // FAVORITES — removed only when the program item is deleted from DB

    const [validFavoriteProgramItemIds, invalidFavoriteProgramItemIds] =
      partition(user.favoriteProgramItemIds, (favoriteProgramItemId) => {
        const foundProgramItem = programItems.find(
          (programItem) => programItem.programItemId === favoriteProgramItemId,
        );
        return foundProgramItem !== undefined;
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
        invalidLotterySignups: removeLotterySignups,
        invalidFavoriteProgramItemIds,
      });

      return {
        ...user,
        lotterySignups: keepLotterySignups,
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
  if (notify && usersToNofify.length > 0) {
    const notifyUsersResult = await notifyUsersWithLotterySignupOrFavorite(
      usersToNofify,
      notifyAffectedDirectSignups,
    );
    if (isErrorResult(notifyUsersResult)) {
      return notifyUsersResult;
    }
  }

  return makeSuccessResult();
};

const notifyUsersWithLotterySignupOrFavorite = async (
  usersToNofify: UserToNofify[],
  affectedDirectSignups: DirectSignupsForProgramItem[],
): Promise<Result<void, MongoDbError>> => {
  const eventUpdates = usersToNofify.flatMap((user) => {
    // If user has already been notified of program item cancel/delete because of a direct signup, don't resend
    const userDirectSignups = new Set(
      affectedDirectSignups.flatMap((directSignup) => {
        const found = directSignup.userSignups.find(
          (userSignup) => userSignup.username === user.username,
        );
        if (found) {
          return directSignup.programItemId;
        }
        return [];
      }),
    );

    const lotteryUpdates = user.invalidLotterySignups.flatMap(
      (lotterySignup) => {
        if (userDirectSignups.has(lotterySignup.programItemId)) {
          return [];
        }
        return {
          username: user.username,
          programItemId: lotterySignup.programItemId,
          programItemStartTime: lotterySignup.signedToStartTime,
          createdAt: dayjs().toISOString(),
        };
      },
    );
    const favoriteUpdates = user.invalidFavoriteProgramItemIds.flatMap(
      (favorite) => {
        if (userDirectSignups.has(favorite)) {
          return [];
        }
        return {
          username: user.username,
          programItemId: favorite,
          programItemStartTime: dayjs().toISOString(),
          createdAt: dayjs().toISOString(),
        };
      },
    );
    return uniqueBy(
      [...lotteryUpdates, ...favoriteUpdates],
      (update) => update.programItemId,
    );
  });

  if (eventUpdates.length > 0) {
    const addEventLogItemsResult = await addEventLogItems({
      action: EventLogAction.PROGRAM_ITEM_CANCELED,
      updates: eventUpdates,
    });
    if (isErrorResult(addEventLogItemsResult)) {
      return addEventLogItemsResult;
    }
  }

  return makeSuccessResult();
};
