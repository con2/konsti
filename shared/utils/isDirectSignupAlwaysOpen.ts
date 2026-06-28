import { config } from "shared/config";
import { ProgramItem } from "shared/types/models/programItem";
import { isPreConventionWeekProgramItem } from "shared/utils/isPreConventionWeekProgramItem";

export const isDirectSignupAlwaysOpen = (programItem: ProgramItem): boolean => {
  const { directSignupAlwaysOpenIds } = config.event();

  // Pre-convention week program items always use direct signup, even if their
  // program type (e.g. RPG) would normally use lottery
  return (
    directSignupAlwaysOpenIds.includes(programItem.programItemId) ||
    isPreConventionWeekProgramItem(programItem)
  );
};
