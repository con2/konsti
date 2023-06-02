import { logger } from "server/utils/logger";
import { createGames } from "server/test/test-data-generation/generators/createGames";
import { createSignedGames } from "server/test/test-data-generation/generators/createSignedGames";
import { removeUsers } from "server/features/user/userRepository";
import { removeResults } from "server/features/results/resultsRepository";
import { removeGames } from "server/features/game/gameRepository";
import { removeSettings } from "server/features/settings/settingsRepository";
import { db } from "server/db/mongodb";
import { generateTestUsers } from "server/test/test-data-generation/generators/generateTestData";
import { createSignups } from "server/test/test-data-generation/generators/createSignups";
import { createSettings } from "server/test/test-data-generation/generators/createSettings";
import { sharedConfig } from "shared/config/sharedConfig";
import { removeSignedGames } from "server/features/user/signed-game/signedGameRepository";
import { removeSignups } from "server/features/signup/signupRepository";
import {
  createAdminUser,
  createHelpUser,
} from "server/test/test-data-generation/generators/createUsers";

interface Options {
  clean?: boolean;
  users?: boolean;
  games?: boolean;
  signups?: boolean;
  entered?: boolean;
}

interface Settings {
  closeDb: boolean;
}

export const runGenerators = async (
  options: Options,
  settings: Settings
): Promise<void> => {
  if (process.env.NODE_ENV === "production") {
    // eslint-disable-next-line no-restricted-syntax -- Data generation script
    throw new Error(`Data creation not allowed in production`);
  }

  // Generator settings
  const enableGroups = sharedConfig.enableGroups;

  // Total users: newUsersCount + groupSize * numberOfGroups + testUsersCount
  const newUsersCount = 40; // Number of individual users

  const groupSize = enableGroups ? 4 : 0; // How many users in each group
  const numberOfGroups = enableGroups ? 15 : 0; // Number of groups

  const testUsersCount = 5; // Number of test users

  // Total games: newGamesCount
  const newGamesCount = 10; // How many games are available for each signup time for each program type

  if (options.clean) {
    logger.info("Clean all data");

    await removeUsers();
    await removeGames();
    await removeSignups();
    await removeResults();
    await removeSettings();
  }

  if (options.users) {
    logger.info("Generate users");

    !options.clean && (await removeUsers());
    !options.clean && (await removeResults());

    await generateTestUsers(
      newUsersCount,
      groupSize,
      numberOfGroups,
      testUsersCount
    );
  }

  // Always create admin and helper
  await createAdminUser();
  await createHelpUser();

  if (options.games) {
    logger.info("Generate games");

    !options.clean && (await removeGames());
    !options.clean && (await removeResults());

    await createGames(newGamesCount);
    await createSettings();
  }

  if (options.signups) {
    logger.info("Generate signed games");

    !options.clean && (await removeSignedGames());
    !options.clean && (await removeResults());

    await createSignedGames();
  }

  if (options.entered) {
    logger.info("Generate signups");

    !options.clean && (await removeSignups());
    !options.clean && (await removeResults());

    await createSignups();
  }

  settings.closeDb && (await db.gracefulExit());
};
