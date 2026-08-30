import { isBefore } from "date-fns";
import { ProgramItem } from "shared/types/models/programItem";
import { LotterySignup } from "shared/types/models/user";
import {
  getLotterySignupEnded,
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
    .filter(
      (lotterySignupProgramItem) =>
        !getLotterySignupEnded(lotterySignupProgramItem, timeNow),
    )
    .map((programItem) => programItem.programItemId);
};
