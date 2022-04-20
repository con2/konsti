import { logger } from "server/utils/logger";
import { removeInvalidGamesFromUsers } from "server/features/player-assignment/utils/removeInvalidGamesFromUsers";
import { db } from "server/db/mongodb";

const removeInvalidGames = async (): Promise<void> => {
  try {
    await db.connectToDb();
  } catch (error) {
    logger.error(error);
    throw error;
  }

  try {
    await removeInvalidGamesFromUsers();
  } catch (error) {
    logger.error(`Error removing invalid games: ${error}`);
    throw error;
  }

  try {
    await db.gracefulExit();
  } catch (error) {
    logger.error(error);
    throw error;
  }
};

removeInvalidGames().catch((error) => {
  logger.error(error);
});
