import { shuffle } from "remeda";
import { ProgramItem } from "shared/types/models/programItem";
import { isStartTimeChanged } from "shared/utils/isStartTimeChanged";
import { DirectSignupsForProgramItem } from "server/features/direct-signup/directSignupTypes";
import { Event } from "server/types/assignmentTypes";

export const getEvents = (
  lotterySignupProgramItems: readonly ProgramItem[],
  lotteryParticipantDirectSignups: readonly DirectSignupsForProgramItem[],
): Event[] => {
  // Indexed rather than scanned: the sign-up documents cover the whole event, and this asks for
  // one per program item being lotteried, so scanning would walk the event once for each
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

      // Spots the program item carried in from another hour are not the lottery's to hand out.
      // One held for this hour is left in, since holding it does not keep its holder out of the
      // lottery. A program item being lotteried holds no spots at all, so this is defence in depth.
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
        // Floored at one attendee while spots remain, and capped by them, so the assigner
        // never receives min > max
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
