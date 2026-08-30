import { shuffle } from "remeda";
import { ProgramItem } from "shared/types/models/programItem";
import { isStartTimeChanged } from "shared/utils/isStartTimeChanged";
import { DirectSignupsForProgramItem } from "server/features/direct-signup/directSignupTypes";
import { Event } from "server/types/assignmentTypes";

export const getEvents = (
  lotterySignupProgramItems: readonly ProgramItem[],
  lotteryParticipantDirectSignups: readonly DirectSignupsForProgramItem[],
): Event[] => {
  // Indexed rather than scanned: the sign-up documents cover every lottery program item in the
  // event, and a program item about to be lotteried usually has none, which is the worst case
  const signupsByProgramItemId = new Map(
    lotteryParticipantDirectSignups.map((signup) => [
      signup.programItemId,
      signup,
    ]),
  );

  const programItems = lotterySignupProgramItems.map(
    (lotterySignupProgramItem) => {
      const programItemSignup = signupsByProgramItemId.get(
        lotterySignupProgramItem.programItemId,
      );

      // Only spots held for another hour, in a program item that has since moved onto this
      // one: their holders are settled there and the lottery cannot use those places. A spot
      // held for this hour is not subtracted, because holding one does not keep its holder out
      // of the lottery for it - counting both would have them competing against themselves
      const currentSignups =
        programItemSignup?.userSignups.filter((userSignup) =>
          isStartTimeChanged(
            userSignup.signedToStartTime,
            lotterySignupProgramItem.startTime,
          ),
        ).length ?? 0;

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
