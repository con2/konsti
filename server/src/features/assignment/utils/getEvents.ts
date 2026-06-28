import { shuffle } from "remeda";
import { ProgramItem } from "shared/types/models/programItem";
import { Event } from "server/types/assignmentTypes";
import { DirectSignupsForProgramItem } from "server/features/direct-signup/directSignupTypes";
import { isStartTimeChanged } from "shared/utils/isStartTimeChanged";

export const getEvents = (
  lotterySignupProgramItems: readonly ProgramItem[],
  lotteryParticipantDirectSignups: readonly DirectSignupsForProgramItem[],
): Event[] => {
  const programItems = lotterySignupProgramItems.map(
    (lotterySignupProgramItem) => {
      // Program item can have existing direct signups if program item's start time has changed
      // Consider existing direct signups when determining program item attendee limits
      const programItemSignup = lotteryParticipantDirectSignups.find(
        (signup) =>
          signup.programItemId === lotterySignupProgramItem.programItemId,
      );

      const changedSignups = programItemSignup?.userSignups.filter(
        (userSignup) => {
          return isStartTimeChanged(
            userSignup.signedToStartTime,
            lotterySignupProgramItem.startTime,
            lotterySignupProgramItem.parentId,
          );
        },
      );

      const currentSignups = changedSignups?.length ?? 0;

      // The lottery only fills the seats left after existing signups; capacity can't go negative
      const remainingMax = Math.max(
        lotterySignupProgramItem.maxAttendance - currentSignups,
        0,
      );

      return {
        id: lotterySignupProgramItem.programItemId,
        // Keep min within [0, remainingMax] so the assigner never receives min > max
        min: Math.min(
          Math.max(lotterySignupProgramItem.minAttendance - currentSignups, 1),
          remainingMax,
        ),
        max: remainingMax,
        groups: [],
      };
    },
  );

  return shuffle(programItems);
};
