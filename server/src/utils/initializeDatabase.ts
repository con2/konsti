import { logger } from "server/utils/logger";
import { saveGames } from "server/features/game/gameRepository";
import { db } from "server/db/mongodb";
import {
  createAdminUser,
  createHelpUser,
  createTestUsers,
} from "server/test/test-data-generation/generators/createUsers";
import { isErrorResult, unwrapResult } from "shared/utils/result";
import { cleanupDatabase } from "server/utils/cleanupDatabse";
import { addSignupQuestions } from "server/features/game/utils/addSignupQuestions";
import { findSettings } from "server/features/settings/settingsRepository";
import { getGamesForConvention } from "server/features/game/gamesService";

const ADMIN_PASSWORD = "";
const HELP_PASSWORD = "";
const CREATE_TEST_USERS = false;

const initializeDatabase = async (): Promise<void> => {
  if (process.env.NODE_ENV === "production") {
    // eslint-disable-next-line no-restricted-syntax -- Data generation script
    throw new Error(`Data creation not allowed in production`);
  }

  await db.connectToDb();

  logger.info("Clean all data");
  await cleanupDatabase();

  logger.info("Create admin user");
  await createAdminUser(ADMIN_PASSWORD);

  logger.info("Create helper user");
  await createHelpUser(HELP_PASSWORD);

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (CREATE_TEST_USERS) {
    logger.info("Create test users");
    await createTestUsers({ userCount: 5 });
  }

  logger.info("Download games from Kompassi");

  const gamesResult = await getGamesForConvention();
  if (isErrorResult(gamesResult)) {
    // eslint-disable-next-line no-restricted-syntax -- Data generation script
    throw new Error("Unable to load Kompassi games");
  }
  const kompassiGames = unwrapResult(gamesResult);
  await saveGames(kompassiGames);

  // This will create default settings
  await findSettings();
  await addSignupQuestions();

  await db.gracefulExit();
};

initializeDatabase().catch((error) => {
  logger.error("Script initializeDatabase failed: %s", error);
});
