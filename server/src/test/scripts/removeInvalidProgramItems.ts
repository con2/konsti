import { logger } from "server/utils/logger";
import { removeCancelledDeletedProgramItemsFromUsers } from "server/features/assignment/utils/removeInvalidProgramItemsFromUsers";
import { db } from "server/db/mongodb";
import { findProgramItems } from "server/features/program-item/programItemRepository";

const removeInvalidProgramItems = async (): Promise<void> => {
  try {
    await db.connectToDb();
  } catch (error) {
    logger.error(error);
    // eslint-disable-next-line no-restricted-syntax -- Test script
    throw error;
  }

  try {
    const programItemsResult = await findProgramItems();
    if (!programItemsResult.ok) {
      // eslint-disable-next-line no-restricted-syntax -- Test script
      throw new Error("Finding program items failed");
    }
    const programItems = programItemsResult.value;
    await removeCancelledDeletedProgramItemsFromUsers({
      programItems,
      currentProgramItems: [],
      notifyAffectedDirectSignups: [],
      notify: false,
    });
  } catch (error) {
    logger.error(
      new Error("Error removing invalid program items", { cause: error }),
    );
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

try {
  await removeInvalidProgramItems();
} catch (error: unknown) {
  logger.error(error);
}
