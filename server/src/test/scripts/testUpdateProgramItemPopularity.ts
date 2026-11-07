import { db } from "server/db/mongodb";
import { updateProgramItemPopularity } from "server/features/program-item-popularity/updateProgramItemPopularity";
import { logger } from "server/utils/logger";

const testUpdateProgramItemPopularity = async (): Promise<void> => {
  try {
    await db.connectToDb();
  } catch (error) {
    logger.error(new Error("Failed to connect to DB", { cause: error }));
  }

  try {
    await updateProgramItemPopularity();
  } catch (error) {
    logger.error(
      new Error("updateProgramItemPopularity error", { cause: error }),
    );
  }

  try {
    await db.gracefulExit();
  } catch (error) {
    logger.error(new Error("Failed to close DB connection", { cause: error }));
  }
};

try {
  await testUpdateProgramItemPopularity();
} catch (error: unknown) {
  logger.error(
    new Error("Failed to update program item popularity", { cause: error }),
  );
}
