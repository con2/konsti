import dayjs from "dayjs";
import { logger } from "server/utils/logger";
import { ProgramItem } from "shared/types/models/programItem";

export const getStartingProgramItems = (
  programItems: readonly ProgramItem[],
  startTime: string,
): readonly ProgramItem[] => {
  logger.debug("Get starting program items");
  const startingProgramItems = [] as ProgramItem[];
  const selectedStartTime = dayjs(startTime);

  // Get program items that start at defined time
  programItems.forEach((programItem) => {
    const programItemStartTime = dayjs(programItem.startTime);
    if (programItemStartTime.isSame(selectedStartTime, "minute")) {
      startingProgramItems.push(programItem);
    }
  });

  logger.debug(
    `Found ${startingProgramItems.length} program items for this start time`,
  );

  return startingProgramItems;
};
