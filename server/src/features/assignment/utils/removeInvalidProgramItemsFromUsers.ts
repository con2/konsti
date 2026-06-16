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
import { Result, makeSuccessResult } from "shared/utils/result";
import { getTimeNow } from "server/features/assignment/utils/getTimeNow";
import { getLotterySignupEndTime } from "shared/utils/signupTimes";
import { isLotterySignupProgramItem } from "shared/utils/isLotterySignupProgramItem";

interface InvalidLotterySignup {
  lotterySignup: LotterySignup;
  action: EventLogAction;
}

interface UserToNofify {
  username: string;
  invalidLotterySignups: InvalidLotterySignup[];
  invalidFavoriteProgramItemIds: FavoriteProgramItemId[];
}

interface RemoveCancelledDeletedProgramItemsFromUsersParams {
  programItems: readonly ProgramItem[];
  notifyAffectedDirectSignups: DirectSignupsForProgramItem[];
  notify: boolean;
}

export const removeCancelledDeletedProgramItemsFromUsers = async ({
  programItems,
  notifyAffectedDirectSignups,
  notify,
}: RemoveCancelledDeletedProgramItemsFromUsersParams): Promise<
  Result<void, MongoDbError>
> => {
  logger.info("Remove invalid program items from users");

  const timeNowResult = await getTimeNow();
  if (!timeNowResult.ok) {
    return timeNowResult;
  }
  const usersResult = await findUsers();
  if (!usersResult.ok) {
    return usersResult;
  }

  const usersToNofify: UserToNofify[] = [];

  const usersToUpdate = usersResult.value.flatMap((user) => {
    // LOTTERY SIGNUPS

    const classifiedLotterySignups = user.lotterySignups.map(
      (lotterySignup) => {
        const foundProgramItem = programItems.find(
          (programItem) =>
            programItem.programItemId === lotterySignup.programItemId,
        );
        const cancellationAction = getCancellationAction(foundProgramItem);

        // Valid signups are kept. Invalid ones are preserved only if the item still
        // exists and its lottery has already run; deleted items are always removed
        const keep =
          cancellationAction === undefined ||
          (foundProgramItem !== undefined &&
            !timeNowResult.value.isBefore(
              getLotterySignupEndTime(foundProgramItem),
            ));

        return { lotterySignup, keep, cancellationAction };
      },
    );

    const keepLotterySignups = classifiedLotterySignups
      .filter((classified) => classified.keep)
      .map((classified) => classified.lotterySignup);

    const removeLotterySignups = classifiedLotterySignups.flatMap(
      (classified) =>
        !classified.keep && classified.cancellationAction !== undefined
          ? [
              {
                lotterySignup: classified.lotterySignup,
                action: classified.cancellationAction,
              },
            ]
          : [],
    );

    const changedLotterySignupsCount =
      user.lotterySignups.length - keepLotterySignups.length;

    if (changedLotterySignupsCount > 0) {
      logger.info(
        `Remove ${changedLotterySignupsCount} cancelled/removed lotterySignups from user ${user.username}`,
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
        `Remove ${changedFavoriteProgramItemIdsCount} cancelled/removed favorite program items from user ${user.username}`,
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
  if (!updateUsersResult.ok) {
    return updateUsersResult;
  }

  // Nofify users with cancelled or deleted program items
  if (notify && usersToNofify.length > 0) {
    const notifyUsersResult = await notifyUsersWithLotterySignupOrFavorite(
      usersToNofify,
      notifyAffectedDirectSignups,
    );
    if (!notifyUsersResult.ok) {
      return notifyUsersResult;
    }
  }

  return makeSuccessResult();
};

// Classifies why a lottery signup program item is invalid, or undefined when it is still valid
const getCancellationAction = (
  programItem: ProgramItem | undefined,
): EventLogAction | undefined => {
  if (!programItem) {
    return EventLogAction.PROGRAM_ITEM_DELETED;
  }
  if (programItem.state !== State.ACCEPTED) {
    return EventLogAction.PROGRAM_ITEM_CANCELLED;
  }
  if (programItem.signupType !== SignupType.KONSTI) {
    return EventLogAction.PROGRAM_ITEM_NO_KONSTI_SIGNUP_ANYMORE;
  }
  if (!isLotterySignupProgramItem(programItem)) {
    return EventLogAction.PROGRAM_ITEM_NO_LOTTERY_ANYMORE;
  }
  return undefined;
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
      ({ lotterySignup, action }) => {
        if (userDirectSignups.has(lotterySignup.programItemId)) {
          return [];
        }
        return {
          username: user.username,
          programItemId: lotterySignup.programItemId,
          programItemStartTime: lotterySignup.signedToStartTime,
          createdAt: dayjs().toISOString(),
          action,
        };
      },
    );
    const favoriteUpdates = user.invalidFavoriteProgramItemIds.flatMap(
      (favorite) => {
        if (userDirectSignups.has(favorite)) {
          return [];
        }
        // Favorites are removed only when the program item is deleted
        return {
          username: user.username,
          programItemId: favorite,
          programItemStartTime: dayjs().toISOString(),
          createdAt: dayjs().toISOString(),
          action: EventLogAction.PROGRAM_ITEM_DELETED,
        };
      },
    );
    return uniqueBy(
      [...lotteryUpdates, ...favoriteUpdates],
      (update) => update.programItemId,
    );
  });

  if (eventUpdates.length > 0) {
    const addEventLogItemsResult = await addEventLogItems(eventUpdates);
    if (!addEventLogItemsResult.ok) {
      return addEventLogItemsResult;
    }
  }

  return makeSuccessResult();
};
