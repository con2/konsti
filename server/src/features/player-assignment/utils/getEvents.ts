import dayjs from "dayjs";
import { ProgramItem } from "shared/types/models/programItem";
import { Event } from "server/types/padgRandomAssignTypes";
import { DirectSignupsForProgramItem } from "server/features/direct-signup/directSignupTypes";

// TODO: Merge this with getRandomAssignEvents
export const getEvents = (
  lotterySignupProgramItems: readonly ProgramItem[],
  directSignups: readonly DirectSignupsForProgramItem[],
): Event[] => {
  return lotterySignupProgramItems.map((lotterySignupProgramItem) => {
    // Program item can have existing signups if program item's start time has changed
    // Consider existing signups when determining program item attendee limits
    const programItemsSignup = directSignups.find(
      (signup) =>
        signup.programItem.programItemId ===
        lotterySignupProgramItem.programItemId,
    );

    const changedSignups = programItemsSignup?.userSignups.filter(
      (userSignup) => {
        const startTimeChanged = !dayjs(userSignup.time).isSame(
          dayjs(lotterySignupProgramItem.startTime),
        );
        if (startTimeChanged) {
          return true;
        }
      },
    );

    const currentSignups = changedSignups?.length ?? 0;

    return {
      id: lotterySignupProgramItem.programItemId,
      min: lotterySignupProgramItem.minAttendance - currentSignups,
      max: lotterySignupProgramItem.maxAttendance - currentSignups,
      groups: [],
    };
  });
};
