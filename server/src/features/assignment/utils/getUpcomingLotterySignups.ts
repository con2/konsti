import dayjs, { Dayjs } from "dayjs";
import { config } from "shared/config";
import { ProgramItem } from "shared/types/models/programItem";
import { LotterySignup } from "shared/types/models/user";

export const getUpcomingLotterySignupProgramItemIds = (
  lotterySignups: readonly LotterySignup[],
  programItems: readonly ProgramItem[],
  timeNow: Dayjs,
): string[] => {
  const lotterySignupProgramItems = lotterySignups.flatMap((signup) => {
    const found = programItems.find(
      (programItem) => programItem.programItemId === signup.programItemId,
    );
    if (!found) {
      return [];
    }
    return found;
  });

  const upcomingLotterySignupProgramItemIds = lotterySignupProgramItems
    .filter((lotterySignupProgramItem) => {
      const parentStartTime = config
        .event()
        .startTimesByParentIds.get(lotterySignupProgramItem.parentId);
      return timeNow.isBefore(
        dayjs(parentStartTime ?? lotterySignupProgramItem.startTime),
      );
    })
    .map((programItem) => programItem.programItemId);

  return upcomingLotterySignupProgramItemIds;
};
