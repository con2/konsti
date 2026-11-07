import { db } from "server/db/mongodb";
import { updateProgramItems } from "server/features/program-item/programItemService";
import { addSignupQuestions } from "server/features/program-item/utils/addSignupQuestions";
import { findOrCreateSettings } from "server/features/settings/settingsRepository";
import { unsafelyUnwrap } from "server/test/utils/unsafelyUnwrapResult";
import { logger } from "server/utils/logger";

const loadKompassiDataToDb = async (): Promise<void> => {
  await db.connectToDb();
  const updateResponse = await updateProgramItems();
  if (updateResponse.status === "error") {
    // eslint-disable-next-line no-restricted-syntax -- Test script
    throw new Error(`Updating program items failed: ${updateResponse.message}`);
  }

  // This will create default settings
  unsafelyUnwrap(await findOrCreateSettings());
  unsafelyUnwrap(await addSignupQuestions());

  await db.gracefulExit();
};

try {
  await loadKompassiDataToDb();
} catch (error: unknown) {
  logger.error(
    new Error("Failed to load Kompassi data to DB", { cause: error }),
  );
  process.exitCode = 1;
  await db.gracefulExit();
}
