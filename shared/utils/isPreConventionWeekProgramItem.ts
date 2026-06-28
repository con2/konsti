import { ProgramItem, Tag } from "shared/types/models/programItem";

export const isPreConventionWeekProgramItem = (
  programItem: ProgramItem,
): boolean => programItem.tags.includes(Tag.PRE_CONVENTION_WEEK);
