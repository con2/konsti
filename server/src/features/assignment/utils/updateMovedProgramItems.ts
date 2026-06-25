import dayjs from "dayjs";
import { logger } from "server/utils/logger";
import { ProgramItem } from "shared/types/models/programItem";
import { findUsers } from "server/features/user/userRepository";
import { Result, makeSuccessResult } from "shared/utils/result";
import { MongoDbError } from "shared/types/api/errors";
import {
  DeleteLotterySignupsParams,
  delLotterySignups,
} from "server/features/user/lottery-signup/lotterySignupRepository";
import { addEventLogItems } from "server/features/user/event-log/eventLogRepository";
import { EventLogAction } from "shared/types/models/eventLog";
import { findDirectSignupsByProgramItemIds } from "server/features/direct-signup/directSignupRepository";

type UsersWithMovedLotterySignups = DeleteLotterySignupsParams[];

export const updateMovedProgramItems = async (
  updatedProgramItems: readonly ProgramItem[],
  currentProgramItems: readonly ProgramItem[],
): Promise<Result<void, MongoDbError>> => {
  const movedProgramItems = currentProgramItems.filter((currentProgramItem) => {
    return updatedProgramItems.find((updatedProgramItem) => {
      return (
        currentProgramItem.programItemId === updatedProgramItem.programItemId &&
        dayjs(currentProgramItem.startTime).toISOString() !==
          dayjs(updatedProgramItem.startTime).toISOString()
      );
    });
  });

  if (movedProgramItems.length === 0) {
    return makeSuccessResult();
  }

  logger.info(`Found ${movedProgramItems.length} moved program items`);

  // This will remove lottery signups
  const removeMovedLotterySignupsResult =
    await removeMovedLotterySignupsAndNotify(movedProgramItems);
  if (!removeMovedLotterySignupsResult.ok) {
    return removeMovedLotterySignupsResult;
  }
  const notifyUsersWithDirectSignupsResult = await notifyUsersWithDirectSignups(
    movedProgramItems,
    removeMovedLotterySignupsResult.value,
  );
  if (!notifyUsersWithDirectSignupsResult.ok) {
    return notifyUsersWithDirectSignupsResult;
  }

  return makeSuccessResult();
};

const removeMovedLotterySignupsAndNotify = async (
  movedProgramItems: readonly ProgramItem[],
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
        createdAt: dayjs().toISOString(),
        action: EventLogAction.PROGRAM_ITEM_MOVED,
      };
    });
  });

  const addEventLogItemsResult = await addEventLogItems(eventUpdates);
  if (!addEventLogItemsResult.ok) {
    return addEventLogItemsResult;
  }

  return makeSuccessResult(usersToUpdate);
};

const notifyUsersWithDirectSignups = async (
  movedProgramItems: ProgramItem[],
  usersWithMovedLotterySignups: UsersWithMovedLotterySignups,
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
      // Check if user also had lottery signup and don't notify twice
      const alreadyNotifiedUser = usersWithMovedLotterySignups.some(
        (user) => user.username === userSignup.username,
      );
      if (alreadyNotifiedUser) {
        return [];
      }
      return {
        username: userSignup.username,
        programItemId: directSignup.programItemId,
        programItemStartTime: movedProgramItem.startTime,
        createdAt: dayjs().toISOString(),
        action: EventLogAction.PROGRAM_ITEM_MOVED,
      };
    });
  });

  const addEventLogItemsResult = await addEventLogItems(userUpdates);
  if (!addEventLogItemsResult.ok) {
    return addEventLogItemsResult;
  }

  return makeSuccessResult();
};
