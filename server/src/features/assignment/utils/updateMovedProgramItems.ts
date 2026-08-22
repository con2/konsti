import { MongoDbError } from "shared/types/api/errors";
import { EventLogAction } from "shared/types/models/eventLog";
import { ProgramItem } from "shared/types/models/programItem";
import { Result, makeSuccessResult } from "shared/utils/result";
import { getProgramItemStartTime } from "shared/utils/signupTimes";
import { getLotterySignupProgramItemIdsForStartTime } from "server/features/assignment/utils/getUpcomingLotterySignups";
import { findDirectSignupsByProgramItemIds } from "server/features/direct-signup/directSignupRepository";
import { queueCancelledDeletedEmails } from "server/features/notifications/queueCancelledDeletedEmails";
import { addEventLogItems } from "server/features/user/event-log/eventLogRepository";
import {
  DeleteLotterySignupsParams,
  delLotterySignups,
} from "server/features/user/lottery-signup/lotterySignupRepository";
import { findUsers } from "server/features/user/userRepository";
import { logger } from "server/utils/logger";

type UsersWithMovedLotterySignups = DeleteLotterySignupsParams[];

export const updateMovedProgramItems = async (
  updatedProgramItems: readonly ProgramItem[],
  currentProgramItems: readonly ProgramItem[],
): Promise<Result<void, MongoDbError>> => {
  const movedProgramItems = updatedProgramItems.filter((updatedProgramItem) => {
    return currentProgramItems.find((currentProgramItem) => {
      return (
        updatedProgramItem.programItemId === currentProgramItem.programItemId &&
        new Date(updatedProgramItem.startTime).toISOString() !==
          new Date(currentProgramItem.startTime).toISOString()
      );
    });
  });

  if (movedProgramItems.length === 0) {
    return makeSuccessResult();
  }

  logger.info(`Found ${movedProgramItems.length} moved program items`);

  const programItemTitlesById = new Map(
    updatedProgramItems.map((programItem) => [
      programItem.programItemId,
      programItem.title,
    ]),
  );

  // This will remove lottery sign-ups
  const removeMovedLotterySignupsResult =
    await removeMovedLotterySignupsAndNotify(
      movedProgramItems,
      programItemTitlesById,
    );
  if (!removeMovedLotterySignupsResult.ok) {
    return removeMovedLotterySignupsResult;
  }
  const notifyUsersWithDirectSignupsResult = await notifyUsersWithDirectSignups(
    movedProgramItems,
    removeMovedLotterySignupsResult.value,
    programItemTitlesById,
  );
  if (!notifyUsersWithDirectSignupsResult.ok) {
    return notifyUsersWithDirectSignupsResult;
  }

  const notifyInertLotterySignupsResult = await notifyInertLotterySignups(
    movedProgramItems,
    updatedProgramItems,
  );
  if (!notifyInertLotterySignupsResult.ok) {
    return notifyInertLotterySignupsResult;
  }

  return makeSuccessResult();
};

// A moved program item can land on top of lottery sign-ups the attendee holding a spot in it made
// for other items. The lottery gives spots only to those who have none, so those sign-ups now sit
// it out. Nothing is cancelled: the attendee didn't cause this, and re-adding a lottery sign-up
// can be impossible once the sign-up window has closed, so they are told instead and can free them
// again by cancelling the spot
const notifyInertLotterySignups = async (
  movedProgramItems: readonly ProgramItem[],
  updatedProgramItems: readonly ProgramItem[],
): Promise<Result<void, MongoDbError>> => {
  const movedProgramItemIds = movedProgramItems.map(
    (programItem) => programItem.programItemId,
  );

  const directSignupsResult =
    await findDirectSignupsByProgramItemIds(movedProgramItemIds);
  if (!directSignupsResult.ok) {
    return directSignupsResult;
  }

  const usersResult = await findUsers();
  if (!usersResult.ok) {
    return usersResult;
  }

  const eventUpdates = directSignupsResult.value.flatMap((directSignup) => {
    const movedProgramItem = movedProgramItems.find(
      (programItem) => programItem.programItemId === directSignup.programItemId,
    );
    if (!movedProgramItem) {
      return [];
    }
    const newStartTime = getProgramItemStartTime(movedProgramItem);

    return directSignup.userSignups.flatMap((userSignup) => {
      const user = usersResult.value.find(
        (found) => found.username === userSignup.username,
      );
      if (!user) {
        return [];
      }

      return getLotterySignupProgramItemIdsForStartTime(
        user.lotterySignups,
        updatedProgramItems,
        newStartTime,
      ).map((programItemId) => ({
        username: user.username,
        programItemId,
        programItemStartTime: newStartTime,
        createdAt: new Date().toISOString(),
        action: EventLogAction.LOTTERY_SIGNUP_NOT_IN_LOTTERY,
      }));
    });
  });

  if (eventUpdates.length === 0) {
    return makeSuccessResult();
  }

  logger.info(
    `${eventUpdates.length} lottery signups sit out their lottery after a moved program item took the slot`,
  );

  return await addEventLogItems(eventUpdates);
};

const removeMovedLotterySignupsAndNotify = async (
  movedProgramItems: readonly ProgramItem[],
  programItemTitlesById: Map<string, string>,
): Promise<Result<UsersWithMovedLotterySignups, MongoDbError>> => {
  logger.info("Remove moved lottery signups from users");

  const usersResult = await findUsers();
  if (!usersResult.ok) {
    return usersResult;
  }
  const usersToUpdate = usersResult.value.flatMap((user) => {
    const movedLotterySignups = user.lotterySignups.filter((lotterySignup) => {
      const movedFound = movedProgramItems.some((movedProgramItem) => {
        return movedProgramItem.programItemId === lotterySignup.programItemId;
      });
      if (movedFound) {
        return lotterySignup;
      }
    });

    if (movedLotterySignups.length === 0) {
      return [];
    }

    const lotterySignupProgramItemIds = movedLotterySignups.map(
      (lotterySignup) => lotterySignup.programItemId,
    );

    logger.info(
      `Remove following moved lotterySignups from user ${
        user.username
      }: ${lotterySignupProgramItemIds.join(", ")}`,
    );

    return {
      username: user.username,
      lotterySignupProgramItemIds,
    };
  });

  const delLotterySignupsResult = await delLotterySignups(usersToUpdate);
  if (!delLotterySignupsResult.ok) {
    return delLotterySignupsResult;
  }

  // Notify users program item start time has changed
  const eventUpdates = usersToUpdate.flatMap((user) => {
    return user.lotterySignupProgramItemIds.flatMap((programItemId) => {
      const movedProgramItem = movedProgramItems.find(
        (programItem) => programItem.programItemId === programItemId,
      );
      if (!movedProgramItem) {
        return [];
      }

      return {
        username: user.username,
        programItemId,
        programItemStartTime: movedProgramItem.startTime,
        createdAt: new Date().toISOString(),
        action: EventLogAction.PROGRAM_ITEM_MOVED,
      };
    });
  });

  const addEventLogItemsResult = await addEventLogItems(eventUpdates);
  if (!addEventLogItemsResult.ok) {
    return addEventLogItemsResult;
  }

  await queueCancelledDeletedEmails(eventUpdates, programItemTitlesById);

  return makeSuccessResult(usersToUpdate);
};

const notifyUsersWithDirectSignups = async (
  movedProgramItems: ProgramItem[],
  usersWithMovedLotterySignups: UsersWithMovedLotterySignups,
  programItemTitlesById: Map<string, string>,
): Promise<Result<void, MongoDbError>> => {
  const movedProgramItemIds = movedProgramItems.map(
    (programItem) => programItem.programItemId,
  );

  const directSignupsResult =
    await findDirectSignupsByProgramItemIds(movedProgramItemIds);
  if (!directSignupsResult.ok) {
    return directSignupsResult;
  }
  const userUpdates = directSignupsResult.value.flatMap((directSignup) => {
    const movedProgramItem = movedProgramItems.find(
      (programItem) => programItem.programItemId === directSignup.programItemId,
    );
    if (!movedProgramItem) {
      return [];
    }

    return directSignup.userSignups.flatMap((userSignup) => {
      // Skip only if the user was already notified for this same program item via the lottery path
      // Different moved item must still notify
      const alreadyNotifiedForThisItem = usersWithMovedLotterySignups.some(
        (user) =>
          user.username === userSignup.username &&
          user.lotterySignupProgramItemIds.includes(directSignup.programItemId),
      );
      if (alreadyNotifiedForThisItem) {
        return [];
      }
      return {
        username: userSignup.username,
        programItemId: directSignup.programItemId,
        programItemStartTime: movedProgramItem.startTime,
        createdAt: new Date().toISOString(),
        action: EventLogAction.PROGRAM_ITEM_MOVED,
      };
    });
  });

  const addEventLogItemsResult = await addEventLogItems(userUpdates);
  if (!addEventLogItemsResult.ok) {
    return addEventLogItemsResult;
  }

  await queueCancelledDeletedEmails(userUpdates, programItemTitlesById);

  return makeSuccessResult();
};
