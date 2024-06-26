import { logger } from "server/utils/logger";
import { updateProgramItemPopularity } from "server/features/program-item-popularity/updateProgramItemPopularity";
import { db } from "server/db/mongodb";
import { initializeDayjs } from "shared/utils/initializeDayjs";

const testUpdateProgramItemPopularity = async (): Promise<void> => {
  initializeDayjs();

  try {
    await db.connectToDb();
  } catch (error) {
    logger.error("%s", error);
  }

  try {
    await updateProgramItemPopularity();
  } catch (error) {
    logger.error("updateProgramItemPopularity error: %s", error);
  }

  try {
    await db.gracefulExit();
  } catch (error) {
    logger.error("%s", error);
  }
};

testUpdateProgramItemPopularity().catch((error: unknown) => {
  logger.error("%s", error);
});
