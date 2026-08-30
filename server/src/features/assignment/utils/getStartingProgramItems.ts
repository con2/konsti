import { ProgramItem } from "shared/types/models/programItem";
import { isSameStartTime } from "shared/utils/signupTimes";
import { logger } from "server/utils/logger";

export const getStartingProgramItems = (
  programItems: readonly ProgramItem[],
  startTime: string,
): readonly ProgramItem[] => {
  logger.debug("Get starting program items");

  const startingProgramItems = programItems.filter((programItem) => {
    return isSameStartTime(
      programItem.startTime,
      startTime,
      programItem.parentId,
    );
  });

  logger.debug(
    `Found ${startingProgramItems.length} program items for this start time`,
  );

  return startingProgramItems;
};
