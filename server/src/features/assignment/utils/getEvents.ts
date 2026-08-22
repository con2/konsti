import { shuffle } from "remeda";
import { ProgramItem } from "shared/types/models/programItem";
import { DirectSignupsForProgramItem } from "server/features/direct-signup/directSignupTypes";
import { Event } from "server/types/assignmentTypes";

export const getEvents = (
  lotterySignupProgramItems: readonly ProgramItem[],
  lotteryParticipantDirectSignups: readonly DirectSignupsForProgramItem[],
): Event[] => {
  const programItems = lotterySignupProgramItems.map(
    (lotterySignupProgramItem) => {
      const programItemSignup = lotteryParticipantDirectSignups.find(
        (signup) =>
          signup.programItemId === lotterySignupProgramItem.programItemId,
      );

      // Every existing direct sign-up holds a spot that is kept, whoever made it: an
      // earlier run of this lottery, direct sign-up after it, or a program item moved
      // into this start time. The attendees holding them are kept out of the run, so
      // the lottery competes only for what is left over
      const currentSignups = programItemSignup?.userSignups.length ?? 0;

      // Capacity can't go negative: a program item whose attendance limit was lowered
      // below the number of attendees already in it offers no spots rather than negative ones
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
