import { logger } from "server/utils/logger";
import { createProgramItems } from "server/test/test-data-generation/generators/createProgramItems";
import { createLotterySignups } from "server/test/test-data-generation/generators/createLotterySignups";
import { removeUsers } from "server/features/user/userRepository";
import { removeResults } from "server/features/results/resultsRepository";
import { removeProgramItems } from "server/features/program-item/programItemRepository";
import { db } from "server/db/mongodb";
import { generateTestUsers } from "server/test/test-data-generation/generators/generateTestData";
import { createDirectSignups } from "server/test/test-data-generation/generators/createSignups";
import { createSettings } from "server/test/test-data-generation/generators/createSettings";
import { config } from "shared/config";
import { removeLotterySignups } from "server/features/user/lottery-signup/lotterySignupRepository";
import { removeDirectSignups } from "server/features/direct-signup/directSignupRepository";
import {
  createAdminUser,
  createHelpUser,
} from "server/test/test-data-generation/generators/createUsers";
import { createEventLogItems } from "server/test/test-data-generation/generators/createEventLogItems";
import { cleanupDatabase } from "server/utils/cleanupDatabse";
import { initializeDayjs } from "shared/utils/initializeDayjs";
import { PopulateDbOptions } from "shared/test-types/api/testData";

interface Settings {
  closeDb: boolean;
}

export const runGenerators = async (
  options: PopulateDbOptions,
  settings: Settings,
): Promise<void> => {
  if (process.env.NODE_ENV === "production") {
    // eslint-disable-next-line no-restricted-syntax -- Data generation script
    throw new Error(`Data creation not allowed in production`);
  }

  initializeDayjs();

  // Generator settings
  const enableGroups = config.event().enableGroups;

  // Total users: newUsersCount + groupSize * numberOfGroups + testUsersCount
  const newUsersCount = 40; // Number of individual users

  const groupSize = enableGroups ? 4 : 0; // How many users in each group
  const numberOfGroups = enableGroups ? 15 : 0; // Number of groups

  const testUsersCount = 5; // Number of test users

  // Total program items: newProgramItemsCount
  const newProgramItemsCount = 10; // How many program items are available for each signup time for each program type

  if (options.clean) {
    logger.info("Clean all data");
    await cleanupDatabase();
  }

  if (options.users) {
    logger.info("Generate users");

    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    !options.clean && (await removeUsers());
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    !options.clean && (await removeResults());

    await generateTestUsers(
      newUsersCount,
      groupSize,
      numberOfGroups,
      testUsersCount,
    );
  }

  // Always create admin and helper
  await createAdminUser();
  await createHelpUser();

  if (options.programItems) {
    logger.info("Generate program items");

    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    !options.clean && (await removeProgramItems());
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    !options.clean && (await removeResults());

    await createProgramItems(newProgramItemsCount);
    await createSettings();
  }

  if (options.lotterySignups) {
    logger.info("Generate lottery signups");

    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    !options.clean && (await removeLotterySignups());
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    !options.clean && (await removeResults());

    await createLotterySignups();
  }

  if (options.directSignups) {
    logger.info("Generate direct signups");

    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    !options.clean && (await removeDirectSignups());
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    !options.clean && (await removeResults());

    await createDirectSignups();
  }

  if (options.eventLog) {
    logger.info("Generate event log items");

    await createEventLogItems();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  settings.closeDb && (await db.gracefulExit());
};
