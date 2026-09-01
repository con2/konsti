import { addHours, addMinutes, isBefore } from "date-fns";
import { config } from "shared/config";
import { ProgramItem } from "shared/types/models/programItem";
import { getProgramItemStartTime } from "shared/utils/signupTimes";

export const tooEarlyForLotterySignup = (programItem: ProgramItem): boolean => {
  const { eventStartTime, directSignupPhaseStart } = config.event();

  // The lottery window is driven by the parent-resolved start time, so use it here too
  const startTime = getProgramItemStartTime(programItem);

  // The first slots of the event get direct sign-up: there is no room for a lottery window
  // before the doors open. Derived rather than a fixed three hours, so it stays the same
  // boundary the direct sign-up time clamps at - the hour of slack past the last lottery that
  // could close at the event start. How many slots that covers follows from the settings; with
  // doors at 15:00, 'preSignupStart' 4h and 'directSignupPhaseStart' 2h it is the first three:
  //   Start time 15:00 -> lottery 11:00-13:00 -> use direct
  //   Start time 16:00 -> lottery 12:00-14:00 -> use direct
  //   Start time 17:00 -> lottery 13:00-15:00 -> use direct
  //   Start time 18:00 -> lottery 14:00-16:00 -> lottery with shorter duration 15:00-16:00
  //   Start time 19:00 -> lottery 15:00-17:00 -> show normally
  const noLotterySignupBefore = addHours(
    addMinutes(new Date(eventStartTime), directSignupPhaseStart),
    1,
  );

  if (isBefore(new Date(startTime), noLotterySignupBefore)) {
    return true;
  }

  return false;
};
