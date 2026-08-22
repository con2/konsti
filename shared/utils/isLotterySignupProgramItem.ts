import { isSameMinute } from "date-fns";
import { config } from "shared/config";
import { ProgramItem } from "shared/types/models/programItem";
import { isDirectSignupAlwaysOpen } from "shared/utils/isDirectSignupAlwaysOpen";
import { getProgramItemStartTime } from "shared/utils/signupTimes";

export const isLotterySignupProgramItem = (
  programItem: ProgramItem,
): boolean => {
  const { twoPhaseSignupProgramTypes } = config.event();

  // Only include "twoPhaseSignupProgramTypes" and don't include "directSignupAlwaysOpen" program items
  return (
    twoPhaseSignupProgramTypes.includes(programItem.programType) &&
    !isDirectSignupAlwaysOpen(programItem)
  );
};

// A program item is lotteried at most once. Once its lottery has run, moving it onto a slot
// whose lottery is still ahead does not put it back in: its remaining spots are first come,
// first served. Compared against where the item starts now, so a re-run of the start time it
// was lotteried for is not treated as a second lottery
export const hasLotteryAlreadyRun = (programItem: ProgramItem): boolean =>
  programItem.lotteryRanForStartTime !== undefined &&
  !isSameMinute(
    new Date(programItem.lotteryRanForStartTime),
    new Date(getProgramItemStartTime(programItem)),
  );
