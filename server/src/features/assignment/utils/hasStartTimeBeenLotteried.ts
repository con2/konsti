import { ProgramItem } from "shared/types/models/programItem";
import { hasLotteryAlreadyRun } from "shared/utils/signupTimes";
import { getStartingProgramItems } from "server/features/assignment/utils/getStartingProgramItems";

// A start time goes through one lottery, so one program item that had its lottery here closes the
// hour for all of them, and what arrived since joins it on direct sign-up. Asked of the whole
// programme, since one cancelled or no longer a lottery item still records this hour ran.
export const hasStartTimeBeenLotteried = (
  programItems: readonly ProgramItem[],
  assignmentTime: string,
): boolean =>
  getStartingProgramItems(programItems, assignmentTime).some(
    (programItem) =>
      programItem.lotteryRanForStartTime !== undefined &&
      // Marked for a slot it no longer starts at means it was lotteried elsewhere and moved
      // onto this one, which says nothing about whether this start time has had its lottery
      !hasLotteryAlreadyRun(programItem),
  );
