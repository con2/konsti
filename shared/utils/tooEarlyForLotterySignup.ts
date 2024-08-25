import dayjs from "dayjs";
import { config } from "shared/config";

export const tooEarlyForLotterySignup = (startTime: string): boolean => {
  const { eventStartTime } = config.event();

  // Return DIRECT for three first hours of event because there is no time for lottery signup
  // For example, if event starts at 15:00 and 'preSignupStart' is 4h and 'directSignupPhaseStart' is 2h
  //   Start time 15:00 -> lottery 11:00-13:00 -> use direct
  //   Start time 16:00 -> lottery 12:00-14:00 -> use direct
  //   Start time 17:00 -> lottery 13:00-15:00 -> use direct
  //   Start time 18:00 -> lottery 14:00-16:00 -> lottery with shorter duration 15:00-16:00 (see signupTimes.ts)
  //   Start time 19:00 -> lottery 15:00-17:00 -> show normally

  const noLotterySignupBefore = dayjs(eventStartTime).add(3, "hours");

  if (dayjs(startTime).isBefore(noLotterySignupBefore)) {
    return true;
  }

  return false;
};
