import dayjs from "dayjs";
import { ProgramItem } from "shared/types/models/programItem";
import { Event } from "server/types/assignmentTypes";
import { DirectSignupsForProgramItem } from "server/features/direct-signup/directSignupTypes";

export const getEvents = (
  lotterySignupProgramItems: readonly ProgramItem[],
  lotteryValidDirectSignups: readonly DirectSignupsForProgramItem[],
): Event[] => {
  return lotterySignupProgramItems.map((lotterySignupProgramItem) => {
    // Program item can have existing direct signups if program item's start time has changed
    // Consider existing direct signups when determining program item attendee limits
    const programItemSignup = lotteryValidDirectSignups.find(
      (signup) =>
        signup.programItemId === lotterySignupProgramItem.programItemId,
    );

    const changedSignups = programItemSignup?.userSignups.filter(
      (userSignup) => {
        const startTimeChanged = !dayjs(userSignup.signedToStartTime).isSame(
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
