import { MongoDbError } from "shared/types/api/errors";
import { EventLogAction } from "shared/types/models/eventLog";
import { ProgramItem } from "shared/types/models/programItem";
import { isLotterySignupProgramItem } from "shared/utils/isLotterySignupProgramItem";
import { Result, makeSuccessResult } from "shared/utils/result";
import { getDirectSignupPhaseStarted } from "shared/utils/signupTimes";
import { getTimeNow } from "server/features/assignment/utils/getTimeNow";
import { DirectSignupsForProgramItem } from "server/features/direct-signup/directSignupTypes";
import { queueCancelledDeletedEmails } from "server/features/notifications/queueCancelledDeletedEmails";
import { addEventLogItems } from "server/features/user/event-log/eventLogRepository";
import {
  DeleteLotterySignupsParams,
  delLotterySignups,
} from "server/features/user/lottery-signup/lotterySignupRepository";
import { findUsers } from "server/features/user/userRepository";
import { logger } from "server/utils/logger";

// A lottery program item holding sign-ups goes to direct sign-up instead. Decided as the
// programme is saved rather than when a run reaches it, so the program item can say so up front,
// and the mark is what keeps the decision once those sign-ups are cancelled
export const getPassedOverProgramItems = async (
  updatedProgramItems: readonly ProgramItem[],
  currentProgramItems: readonly ProgramItem[],
  directSignups: readonly DirectSignupsForProgramItem[],
): Promise<Result<ProgramItem[], MongoDbError>> => {
  const timeNowResult = await getTimeNow();
  if (!timeNowResult.ok) {
    return timeNowResult;
  }
  const attendeeCountByProgramItemId = new Map(
    directSignups.map((directSignup) => [
      directSignup.programItemId,
      directSignup.userSignups.length,
    ]),
  );
  // What is stored is what was there before this save, since neither field is in the import's
  // update - a program item the database does not know about is a new one and carries neither
  const decidedProgramItemIds = new Set(
    currentProgramItems
      .filter(
        (programItem) =>
          programItem.lotteryRanForStartTime !== undefined ||
          programItem.passedOverForLottery === true,
      )
      .map((programItem) => programItem.programItemId),
  );

  const passedOverProgramItems = updatedProgramItems.filter(
    (programItem) =>
      isLotterySignupProgramItem(programItem) &&
      !decidedProgramItemIds.has(programItem.programItemId) &&
      (attendeeCountByProgramItemId.get(programItem.programItemId) ?? 0) > 0 &&
      // Only while its schedule still has something to take away. Measured to the moment
      // direct sign-up would open rather than to the lottery's close, so a program item that
      // becomes a lottery one inside the phase gap does not have its open sign-up shut for
      // the rest of it
      !getDirectSignupPhaseStarted(programItem, timeNowResult.value),
  );

  if (passedOverProgramItems.length > 0) {
    logger.info(
      `${passedOverProgramItems.length} program items already hold sign-ups, marking them as not taking part in a lottery: ${passedOverProgramItems.map((programItem) => programItem.programItemId).join(", ")}`,
    );
  }

  return makeSuccessResult(passedOverProgramItems);
};

// Lottery sign-ups for a program item that will not be lotteried after all. They are for a
// lottery that will not happen, so they go the same way as those for a program item whose program
// type leaves the lottery, and say the same thing
export const removePassedOverLotterySignups = async (
  passedOverProgramItems: readonly ProgramItem[],
): Promise<Result<void, MongoDbError>> => {
  if (passedOverProgramItems.length === 0) {
    return makeSuccessResult();
  }

  const passedOverProgramItemIds = new Set(
    passedOverProgramItems.map((programItem) => programItem.programItemId),
  );

  const usersResult = await findUsers();
  if (!usersResult.ok) {
    return usersResult;
  }

  const usersToUpdate: DeleteLotterySignupsParams[] = usersResult.value.flatMap(
    (user) => {
      const lotterySignupProgramItemIds = user.lotterySignups
        .filter((lotterySignup) =>
          passedOverProgramItemIds.has(lotterySignup.programItemId),
        )
        .map((lotterySignup) => lotterySignup.programItemId);

      if (lotterySignupProgramItemIds.length === 0) {
        return [];
      }
      return { username: user.username, lotterySignupProgramItemIds };
    },
  );

  if (usersToUpdate.length === 0) {
    return makeSuccessResult();
  }

  const delLotterySignupsResult = await delLotterySignups(usersToUpdate);
  if (!delLotterySignupsResult.ok) {
    return delLotterySignupsResult;
  }

  const eventUpdates = usersToUpdate.flatMap((user) =>
    passedOverProgramItems
      .filter((programItem) =>
        user.lotterySignupProgramItemIds.includes(programItem.programItemId),
      )
      .map((programItem) => ({
        username: user.username,
        programItemId: programItem.programItemId,
        programItemStartTime: programItem.startTime,
        createdAt: new Date().toISOString(),
        action: EventLogAction.PROGRAM_ITEM_NO_LOTTERY_ANYMORE,
      })),
  );

  const addEventLogItemsResult = await addEventLogItems(eventUpdates);
  if (!addEventLogItemsResult.ok) {
    return addEventLogItemsResult;
  }

  await queueCancelledDeletedEmails(
    eventUpdates,
    new Map(
      passedOverProgramItems.map((programItem) => [
        programItem.programItemId,
        programItem.title,
      ]),
    ),
  );

  return makeSuccessResult();
};
