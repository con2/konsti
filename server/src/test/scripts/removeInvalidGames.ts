import { logger } from "server/utils/logger";
import { removeInvalidProgramItemsFromUsers } from "server/features/player-assignment/utils/removeInvalidProgramItemsFromUsers";
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
    await removeInvalidProgramItemsFromUsers();
  } catch (error) {
    logger.error("Error removing invalid program items: %s", error);
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

removeInvalidGames().catch((error: unknown) => {
  logger.error(error);
});
