import { config } from "shared/config";
import { ProgramItem, Tag } from "shared/types/models/programItem";

export const isDirectSignupAlwaysOpen = (programItem: ProgramItem): boolean => {
  const { directSignupAlwaysOpenIds } = config.event();

  // Pre-convention week program items always use direct signup, even if their
  // program type (e.g. RPG) would normally use lottery
  return (
    directSignupAlwaysOpenIds.includes(programItem.programItemId) ||
    programItem.tags.includes(Tag.PRE_CONVENTION_WEEK)
  );
};
