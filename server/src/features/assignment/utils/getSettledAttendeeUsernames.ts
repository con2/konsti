import { ProgramItem } from "shared/types/models/programItem";
import { DirectSignupsForProgramItem } from "server/features/direct-signup/directSignupTypes";

// Users who already hold a spot in a program item starting at this time, whichever way
// they got it: an earlier run of this lottery, direct sign-up after it, direct sign-up to
// an always-open program item, or a program item moved into this start time. The lottery
// leaves them alone, so it only ever hands out spots to attendees who have none.
//
// Every spot the capacity calculation subtracts from a program item's attendance limits
// belongs to someone in this set, which is what keeps the two in step: a spot may only be
// counted as taken while the attendee holding it is kept out of the run, or the lottery
// double-books it. Settling attendees whose spot isn't counted, the always-open ones,
// costs nothing - the lottery never allocates those program items in the first place
export const getSettledAttendeeUsernames = (
  startingProgramItems: readonly ProgramItem[],
  directSignups: readonly DirectSignupsForProgramItem[],
): ReadonlySet<string> => {
  const startingProgramItemIds = new Set(
    startingProgramItems.map((programItem) => programItem.programItemId),
  );

  return new Set(
    directSignups.flatMap((directSignup) =>
      startingProgramItemIds.has(directSignup.programItemId)
        ? directSignup.userSignups.map((userSignup) => userSignup.username)
        : [],
    ),
  );
};
