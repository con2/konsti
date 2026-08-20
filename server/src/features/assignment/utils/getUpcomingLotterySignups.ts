import { isBefore } from "date-fns";
import { config } from "shared/config";
import { ProgramItem } from "shared/types/models/programItem";
import { LotterySignup } from "shared/types/models/user";
import { getLotterySignupEndTime } from "shared/utils/signupTimes";

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
    .filter((lotterySignupProgramItem) => {
      const parentStartTime = config
        .event()
        .startTimesByParentIds.get(lotterySignupProgramItem.parentId);
      return isBefore(
        timeNow,
        new Date(parentStartTime ?? lotterySignupProgramItem.startTime),
      );
    })
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
