import { config } from "shared/config";
import { ProgramItem } from "shared/types/models/programItem";

export const isLotterySignupProgramItem = (
  programItem: ProgramItem,
): boolean => {
  const { directSignupAlwaysOpenIds, twoPhaseSignupProgramTypes } =
    config.event();

  // Only include "twoPhaseSignupProgramTypes" and don't include "directSignupAlwaysOpen" program items
  return (
    twoPhaseSignupProgramTypes.includes(programItem.programType) &&
    !directSignupAlwaysOpenIds.includes(programItem.programItemId)
  );
};
