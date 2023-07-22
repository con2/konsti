import dayjs from "dayjs";
import { logger } from "server/utils/logger";
import { Game } from "shared/typings/models/game";

export const getStartingGames = (
  games: readonly Game[],
  startTime: string
): readonly Game[] => {
  logger.debug("Get starting games");
  const startingGames = [] as Game[];
  const selectedStartTime = dayjs(startTime);

  // Get games that start at defined time
  games.forEach((game) => {
    const gameStartTime = dayjs(game.startTime);
    if (gameStartTime.isSame(selectedStartTime, "minute")) {
      startingGames.push(game);
    }
  });

  logger.debug(`Found ${startingGames.length} games for this start time`);

  return startingGames;
};
