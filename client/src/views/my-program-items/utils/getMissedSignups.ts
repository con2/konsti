import dayjs from "dayjs";
import { getStartTimes } from "client/utils/getStartTimes";
import { config } from "shared/config";
import { getTimeNow } from "client/utils/getTimeNow";
import { DirectSignup } from "shared/types/models/user";
import { LotterySignupWithProgramItem } from "client/views/my-program-items/myProgramItemsSlice";

export const getMissedSignups = (
  lotterySignups: readonly LotterySignupWithProgramItem[],
  directSignups: readonly DirectSignup[],
): string[] => {
  // Wait this long before showing "you didn't get into program item"
  // TODO: Instead of hard-coding, figure dynamically if assignment is still running
  const safePeriod = 3; // minutes

  const timeNow = getTimeNow();

  const lotterySignupsStartTimes = getStartTimes(
    lotterySignups.map((lotterySignup) => lotterySignup.programItem),
  );

  // Get signup times for past lottery signup
  const pastSignupTimes = lotterySignupsStartTimes.filter(
    (lotterySignupsStartTime) => {
      const signupEndTime = dayjs(lotterySignupsStartTime).subtract(
        config.event().directSignupPhaseStart - safePeriod,
        "minutes",
      );

      if (signupEndTime.isBefore(dayjs(timeNow))) {
        return lotterySignupsStartTime;
      }
    },
  );

  // Check if there are past lottery signups without direct signup => missed signup
  const missedSignupTimes = pastSignupTimes.filter((pastSignupTime) => {
    let found = false;
    if (directSignups.length === 0) {
      return pastSignupTime;
    }

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    directSignups.find((directSignup) => {
      if (directSignup.signedToStartTime === pastSignupTime) {
        found = true;
      }
    });

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!found) {
      return pastSignupTime;
    }
  });

  const missedSignups: string[] = missedSignupTimes.map((missedSignupTime) => {
    return missedSignupTime;
  });

  return missedSignups;
};
