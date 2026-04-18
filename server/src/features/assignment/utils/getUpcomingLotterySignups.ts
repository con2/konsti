import dayjs, { Dayjs } from "dayjs";
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
  timeNow: Dayjs,
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
      return timeNow.isBefore(
        dayjs(parentStartTime ?? lotterySignupProgramItem.startTime),
      );
    })
    .map((programItem) => programItem.programItemId);
};

export const getLotteryNotYetRunProgramItemIds = (
  lotterySignups: readonly LotterySignup[],
  programItems: readonly ProgramItem[],
  timeNow: Dayjs,
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
      return timeNow.isBefore(lotterySignupEndTime);
    })
    .map((programItem) => programItem.programItemId);
};
