import { db } from "server/db/mongodb";
import { updateProgramItems } from "server/features/program-item/programItemService";
import { addSignupQuestions } from "server/features/program-item/utils/addSignupQuestions";
import { findSettings } from "server/features/settings/settingsRepository";
import { logger } from "server/utils/logger";
import { initializeDayjs } from "shared/utils/initializeDayjs";

const loadKompassiDataToDb = async (): Promise<void> => {
  initializeDayjs();
  await db.connectToDb();
  await updateProgramItems();

  // This will create default settings
  await findSettings();
  await addSignupQuestions();

  await db.gracefulExit();
};

loadKompassiDataToDb().catch((error: unknown) => {
  logger.error(error);
});
