import { logger } from "server/utils/logger";
import { updateGamePopularity } from "server/features/game-popularity/updateGamePopularity";
import { db } from "server/db/mongodb";
import { initializeDayjs } from "shared/utils/initializeDayjs";

const testUpdateGamePopularity = async (): Promise<void> => {
  initializeDayjs();

  try {
    await db.connectToDb();
  } catch (error) {
    logger.error(error);
  }

  try {
    await updateGamePopularity();
  } catch (error) {
    logger.error("updateGamePopularity error: %s", error);
  }

  try {
    await db.gracefulExit();
  } catch (error) {
    logger.error(error);
  }
};

testUpdateGamePopularity().catch((error: unknown) => {
  logger.error(error);
});
