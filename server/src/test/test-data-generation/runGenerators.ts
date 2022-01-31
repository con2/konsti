import { Command } from "commander";
import { logger } from "server/utils/logger";
import { createGames } from "server/test/test-data-generation/generators/createGames";
import { createSignups } from "server/test/test-data-generation/generators/createSignups";
import {
  removeEnteredGames,
  removeSignedGames,
  removeUsers,
} from "server/features/user/userRepository";
import { removeResults } from "server/features/results/resultsRepository";
import { removeGames } from "server/features/game/gameRepository";
import { removeSettings } from "server/features/settings/settingsRepository";
import { db } from "server/db/mongodb";
import { generateTestUsers } from "server/test/test-data-generation/generators/generateTestData";
import { createEnteredGames } from "server/test/test-data-generation/generators/createEnteredGames";
import { createSettings } from "server/test/test-data-generation/generators/createSettings";
import { sharedConfig } from "shared/config/sharedConfig";

const runGenerators = async (): Promise<void> => {
  if (process.env.NODE_ENV === "production") {
    throw new Error(`Data creation not allowed in production`);
  }

  const commander = new Command();

  // Generator settings
  const enableGroups = sharedConfig.enableGroups;

  // Total users: newUsersCount + groupSize * numberOfGroups + testUsersCount
  const newUsersCount = 40; // Number of individual users

  const groupSize = enableGroups ? 3 : 0; // How many users in each group
  const numberOfGroups = enableGroups ? 15 : 0; // Number of groups

  const testUsersCount = 5; // Number of test users

  // Total games: newGamesCount * signupTimes
  const newGamesCount = 10; // How many games are available for each signup time
  const signupTimes = 3; // For how many signup times games are created

  commander
    .option("-u, --users", "Generate users")
    .option("-s, --signups", "Generate signups")
    .option("-e, --entered", "Generate entered games")
    .option("-g, --games", "Generate games")
    .option("-c, --clean", "Clean all data");

  const options = commander.opts();

  if (process.argv.length < 3) {
    commander.help();
  }

  commander.parse(process.argv);

  await db.connectToDb();

  if (options.clean) {
    logger.info("Clean all data");

    await removeUsers();
    await removeGames();
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

  if (options.games) {
    logger.info("Generate games");

    !options.clean && (await removeGames());
    !options.clean && (await removeResults());

    await createGames(newGamesCount, signupTimes);
  }

  if (options.signups) {
    logger.info("Generate signups");

    !options.clean && (await removeSignedGames());
    !options.clean && (await removeResults());

    await createSignups();
  }

  if (options.entered) {
    logger.info("Generate signups");

    !options.clean && (await removeEnteredGames());
    !options.clean && (await removeResults());

    await createSettings({ signupMessages: true });
    await createEnteredGames();
  }

  await db.gracefulExit();
};

runGenerators().catch((error) => {
  logger.error(error);
});
