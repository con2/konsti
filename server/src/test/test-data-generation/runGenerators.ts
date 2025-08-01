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
    throw new Error("Generator: Data creation not allowed in production");
  }

  initializeDayjs();

  // Generator settings
  const enableGroups = config.event().enableGroups;

  // Total users: newUsersCount + groupSize * numberOfGroups + testUsersCount
  const newUsersCount = 60; // Number of individual users

  const groupSize = enableGroups ? 4 : 0; // How many users in each group
  const numberOfGroups = enableGroups ? 15 : 0; // Number of groups

  const testUsersCount = 5; // Number of test users

  // Total program items: newProgramItemsCount
  const newProgramItemsCount = 10; // How many program items are available for each signup time for each program type

  if (options.clean) {
    logger.info("* Generator: Clean all data");
    await cleanupDatabase();
    logger.info("* Generator: Completed clean all data");
  }

  if (options.users) {
    logger.info("* Generator: Generate users");

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

    logger.info("* Generator: Completed generate users");
  }

  if (options.admin) {
    logger.info("* Generator: Generate admin and helper users");

    await createAdminUser();
    await createHelpUser();

    logger.info("* Generator: Completed generate admin and helper users");
  }

  if (options.programItems) {
    logger.info("* Generator: Generate program items");

    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    !options.clean && (await removeProgramItems());
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    !options.clean && (await removeResults());

    await createProgramItems(newProgramItemsCount);
    await createSettings();

    logger.info("* Generator: Completed generate program items");
  }

  if (options.lotterySignups) {
    logger.info("* Generator: Generate lottery signups");

    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    !options.clean && (await removeLotterySignups());
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    !options.clean && (await removeResults());

    await createLotterySignups();

    logger.info("* Generator: Completed generate lottery signups");
  }

  if (options.directSignups) {
    logger.info("* Generator: Generate direct signups");

    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    !options.clean && (await removeDirectSignups());
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    !options.clean && (await removeResults());

    await createDirectSignups();

    logger.info("* Generator: Completed generate direct signups");
  }

  if (options.eventLog) {
    logger.info("* Generator: Generate event log items");
    await createEventLogItems();
    logger.info("* Generator: Completed generate event log items");
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  settings.closeDb && (await db.gracefulExit());
};
