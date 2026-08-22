import { isBefore, isSameMinute } from "date-fns";
import { ProgramItem } from "shared/types/models/programItem";
import { LotterySignup } from "shared/types/models/user";
import {
  getLotterySignupEndTime,
  getProgramItemStartTime,
} from "shared/utils/signupTimes";

const getLotterySignupProgramItems = (
  lotterySignups: readonly LotterySignup[],
  programItems: readonly ProgramItem[],
): ProgramItem[] =>
  lotterySignups.flatMap((signup) => {
    const found = programItems.find(
      (programItem) => programItem.programItemId === signup.programItemId,
    );
    if (!found) {
      return [];
    }
    return found;
  });

export const getUpcomingLotterySignupProgramItemIds = (
  lotterySignups: readonly LotterySignup[],
  programItems: readonly ProgramItem[],
  timeNow: Date,
): string[] => {
  const lotterySignupProgramItems = getLotterySignupProgramItems(
    lotterySignups,
    programItems,
  );

  return lotterySignupProgramItems
    .filter((lotterySignupProgramItem) =>
      isBefore(
        timeNow,
        new Date(getProgramItemStartTime(lotterySignupProgramItem)),
      ),
    )
    .map((programItem) => programItem.programItemId);
};

// Lottery sign-ups competing for one start time. Resolved through the program item rather than
// read off the sign-up: a lottery sign-up stores the item's own start time while the start time
// being matched is parent-resolved, and a rescheduled item's sign-up still carries the old one
export const getLotterySignupProgramItemIdsForStartTime = (
  lotterySignups: readonly LotterySignup[],
  programItems: readonly ProgramItem[],
  startTime: string,
): string[] => {
  const lotterySignupProgramItems = getLotterySignupProgramItems(
    lotterySignups,
    programItems,
  );

  return lotterySignupProgramItems
    .filter((lotterySignupProgramItem) =>
      isSameMinute(
        new Date(getProgramItemStartTime(lotterySignupProgramItem)),
        new Date(startTime),
      ),
    )
    .map((programItem) => programItem.programItemId);
};

export const getLotteryNotYetRunProgramItemIds = (
  lotterySignups: readonly LotterySignup[],
  programItems: readonly ProgramItem[],
  timeNow: Date,
): string[] => {
  const lotterySignupProgramItems = getLotterySignupProgramItems(
    lotterySignups,
    programItems,
  );

  return lotterySignupProgramItems
    .filter((lotterySignupProgramItem) => {
      const lotterySignupEndTime = getLotterySignupEndTime(
        lotterySignupProgramItem,
      );
      return isBefore(timeNow, lotterySignupEndTime);
    })
    .map((programItem) => programItem.programItemId);
};
