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

  const usersResult = await findUsers();
  if (isErrorResult(usersResult)) {
    return usersResult;
  }

  const usersToNofify: UserToNofify[] = [];

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
        return (
          foundProgramItem?.state === State.ACCEPTED &&
          foundProgramItem.signupType === SignupType.KONSTI
        );
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
        return (
          foundProgramItem?.state === State.ACCEPTED &&
          foundProgramItem.signupType === SignupType.KONSTI
        );
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
