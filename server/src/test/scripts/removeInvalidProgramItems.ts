import { logger } from "server/utils/logger";
import { removeCanceledDeletedProgramItemsFromUsers } from "server/features/assignment/utils/removeInvalidProgramItemsFromUsers";
import { db } from "server/db/mongodb";
import { isErrorResult, unwrapResult } from "shared/utils/result";
import { findProgramItems } from "server/features/program-item/programItemRepository";

const removeInvalidProgramItems = async (): Promise<void> => {
  try {
    await db.connectToDb();
  } catch (error) {
    logger.error("%s", error);
    // eslint-disable-next-line no-restricted-syntax -- Test script
    throw error;
  }

  try {
    const programItemsResult = await findProgramItems();
    if (isErrorResult(programItemsResult)) {
      // eslint-disable-next-line no-restricted-syntax -- Test script
      throw new Error("Finding program items failed");
    }
    const programItems = unwrapResult(programItemsResult);
    await removeCanceledDeletedProgramItemsFromUsers(programItems);
  } catch (error) {
    logger.error("Error removing invalid program items: %s", error);
    // eslint-disable-next-line no-restricted-syntax -- Test script
    throw error;
  }

  try {
    await db.gracefulExit();
  } catch (error) {
    logger.error("%s", error);
    // eslint-disable-next-line no-restricted-syntax -- Test script
    throw error;
  }
};

removeInvalidProgramItems().catch((error: unknown) => {
  logger.error("%s", error);
});
