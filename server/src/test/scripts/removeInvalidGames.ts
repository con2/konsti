import { logger } from "server/utils/logger";
import { removeInvalidGamesFromUsers } from "server/features/player-assignment/utils/removeInvalidGamesFromUsers";
import { db } from "server/db/mongodb";

const removeInvalidGames = async (): Promise<void> => {
  try {
    await db.connectToDb();
  } catch (error) {
    logger.error(error);
    // eslint-disable-next-line no-restricted-syntax -- Test script
    throw error;
  }

  try {
    await removeInvalidGamesFromUsers();
  } catch (error) {
    logger.error("Error removing invalid games: %s", error);
    // eslint-disable-next-line no-restricted-syntax -- Test script
    throw error;
  }

  try {
    await db.gracefulExit();
  } catch (error) {
    logger.error(error);
    // eslint-disable-next-line no-restricted-syntax -- Test script
    throw error;
  }
};

removeInvalidGames().catch((error) => {
  logger.error(error);
});
