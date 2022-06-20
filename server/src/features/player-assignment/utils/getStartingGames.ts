import dayjs from "dayjs";
import { logger } from "server/utils/logger";
import { Game } from "shared/typings/models/game";

export const getStartingGames = (
  games: readonly Game[],
  startingTime: string
): readonly Game[] => {
  logger.debug("Get starting games");
  const startingGames = [] as Game[];
  const selectedStartingTime = dayjs(startingTime).format();

  // Get games that start at defined time
  games.forEach((game) => {
    const gameStartingTime = dayjs(game.startTime).format();
    if (gameStartingTime === selectedStartingTime) {
      startingGames.push(game);
    }
  });

  logger.debug(`Found ${startingGames.length} games for this starting time`);

  return startingGames;
};
