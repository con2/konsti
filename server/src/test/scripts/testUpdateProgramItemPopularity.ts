import { db } from "server/db/mongodb";
import { updateProgramItemPopularity } from "server/features/program-item-popularity/updateProgramItemPopularity";
import { logger } from "server/utils/logger";

const testUpdateProgramItemPopularity = async (): Promise<void> => {
  await db.connectToDb();
  await updateProgramItemPopularity();
  await db.gracefulExit();
};

try {
  await testUpdateProgramItemPopularity();
} catch (error: unknown) {
  logger.error(
    new Error("Failed to update program item popularity", { cause: error }),
  );
  process.exitCode = 1;
  await db.gracefulExit();
}
