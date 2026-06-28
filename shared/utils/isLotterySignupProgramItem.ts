import { config } from "shared/config";
import { ProgramItem } from "shared/types/models/programItem";
import { isDirectSignupAlwaysOpen } from "shared/utils/isDirectSignupAlwaysOpen";

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
