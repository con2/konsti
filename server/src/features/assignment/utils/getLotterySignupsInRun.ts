import { ProgramItem } from "shared/types/models/programItem";
import { LotterySignup } from "shared/types/models/user";
import { isSameStartTime } from "shared/utils/signupTimes";

// Indexed rather than scanned: asked once per lottery sign-up of every attendee group
export const indexProgramItemsById = (
  programItems: readonly ProgramItem[],
): ReadonlyMap<string, ProgramItem> =>
  new Map(
    programItems.map((programItem) => [programItem.programItemId, programItem]),
  );

// The preferences one run is allocating. The group list and the gain list have to answer this
// the same way, and a sign-up naming a program item the run is not allocating has no event to
// map to - the assigner rejects the whole input over a single such preference.
export const getLotterySignupsInRun = (
  lotterySignups: readonly LotterySignup[],
  programItemsById: ReadonlyMap<string, ProgramItem>,
  assignmentTime: string,
): LotterySignup[] =>
  lotterySignups.filter((lotterySignup) => {
    const programItem = programItemsById.get(lotterySignup.programItemId);
    if (!programItem) {
      return false;
    }
    return isSameStartTime(
      programItem.startTime,
      assignmentTime,
      programItem.parentId,
    );
  });
