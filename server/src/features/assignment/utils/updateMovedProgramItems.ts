import { MongoDbError } from "shared/types/api/errors";
import { EventLogAction } from "shared/types/models/eventLog";
import { ProgramItem } from "shared/types/models/programItem";
import { Result, makeSuccessResult } from "shared/utils/result";
import {
  getLotterySignupEnded,
  lotteryRanForProgramItem,
} from "shared/utils/signupTimes";
import { getTimeNow } from "server/features/assignment/utils/getTimeNow";
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

  // Read from what is stored: the incoming programme carries no lottery marks
  const lotteriedProgramItemIds = new Set(
    currentProgramItems
      .filter((programItem) => lotteryRanForProgramItem(programItem))
      .map((programItem) => programItem.programItemId),
  );

  // This will remove lottery sign-ups
  const removeMovedLotterySignupsResult =
    await removeMovedLotterySignupsAndNotify(
      movedProgramItems,
      lotteriedProgramItemIds,
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

  return makeSuccessResult();
};

const removeMovedLotterySignupsAndNotify = async (
  movedProgramItems: readonly ProgramItem[],
  lotteriedProgramItemIds: ReadonlySet<string>,
  programItemTitlesById: Map<string, string>,
): Promise<Result<UsersWithMovedLotterySignups, MongoDbError>> => {
  logger.info("Remove moved lottery signups from users");

  const timeNowResult = await getTimeNow();
  if (!timeNowResult.ok) {
    return timeNowResult;
  }

  // A sign-up whose lottery has run records that the attendee entered it, and moving the program
  // item afterwards does not unmake that. Only one still waiting for its lottery is removed, since
  // it asks for a slot the program item has left. The mark is what answers here: the window is
  // derived from the slot just moved to, so a move to a later one reopens it.
  const movedProgramItemIds = new Set(
    movedProgramItems
      .filter(
        (programItem) =>
          !lotteriedProgramItemIds.has(programItem.programItemId) &&
          !getLotterySignupEnded(programItem, timeNowResult.value),
      )
      .map((programItem) => programItem.programItemId),
  );

  const usersResult = await findUsers();
  if (!usersResult.ok) {
    return usersResult;
  }
  const usersToUpdate = usersResult.value.flatMap((user) => {
    const movedLotterySignups = user.lotterySignups.filter((lotterySignup) =>
      movedProgramItemIds.has(lotterySignup.programItemId),
    );

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
