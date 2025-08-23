import { isStartTimeMatch } from "server/utils/isStartTimeMatch";
import { logger } from "server/utils/logger";
import { ProgramItem } from "shared/types/models/programItem";

export const getStartingProgramItems = (
  programItems: readonly ProgramItem[],
  startTime: string,
): readonly ProgramItem[] => {
  logger.debug("Get starting program items");

  const startingProgramItems = programItems.filter((programItem) => {
    return isStartTimeMatch(
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
