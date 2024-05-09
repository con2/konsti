import dayjs from "dayjs";
import { logger } from "server/utils/logger";
import { ProgramItem } from "shared/types/models/programItem";

export const getStartingProgramItems = (
  programItems: readonly ProgramItem[],
  startTime: string,
): readonly ProgramItem[] => {
  logger.debug("Get starting program items");
  const startingGames = [] as ProgramItem[];
  const selectedStartTime = dayjs(startTime);

  // Get games that start at defined time
  programItems.forEach((game) => {
    const gameStartTime = dayjs(game.startTime);
    if (gameStartTime.isSame(selectedStartTime, "minute")) {
      startingGames.push(game);
    }
  });

  logger.debug(
    `Found ${startingGames.length} program items for this start time`,
  );

  return startingGames;
};
