import 'array-flat-polyfill';
import { Command } from 'commander';
import { logger } from 'server/utils/logger';
import { createGames } from 'server/test/test-data-generation/generators/createGames';
import { createSignups } from 'server/test/test-data-generation/generators/createSignups';
import { removeUsers } from 'server/features/user/userRepository';
import { removeResults } from 'server/features/results/resultsRepository';
import { removeGames } from 'server/features/game/gameRepository';
import { removeSettings } from 'server/features/settings/settingsRepository';
import { db } from 'server/db/mongodb';
import { generateTestUsers } from 'server/test/test-data-generation/generators/generateTestData';

const runGenerators = async (): Promise<void> => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(`Data creation not allowed in production`);
  }

  const commander = new Command();

  // Total users: newUsersCount + groupSize * numberOfGroups + testUsersCount
  const newUsersCount = 40; // Number of individual users
  const groupSize = 3; // How many users in each group
  const numberOfGroups = 15; // Number of groups
  const testUsersCount = 5; // Number of test users

  // Total games: newGamesCount * signupTimes
  const newGamesCount = 10; // How many games are available for each signup time
  const signupTimes = 3; // For how many signup times games are created

  commander
    .option('-u, --users', 'Generate users')
    .option('-s, --signups', 'Generate signups')
    .option('-g, --games', 'Generate games')
    .option('-c, --clean', 'Clean all data');

  const options = commander.opts();

  if (process.argv.length < 3) {
    commander.help();
  }

  commander.parse(process.argv);

  try {
    await db.connectToDb();
  } catch (error) {
    logger.error(error);
    return;
  }

  if (options.clean) {
    logger.info('Clean all data');

    try {
      await removeUsers();
    } catch (error) {
      logger.error(error);
    }

    try {
      await removeGames();
    } catch (error) {
      logger.error(error);
    }

    try {
      await removeResults();
    } catch (error) {
      logger.error(error);
    }

    try {
      await removeSettings();
    } catch (error) {
      logger.error(error);
    }
  }

  if (options.users) {
    logger.info('Generate users');

    try {
      await removeUsers();
    } catch (error) {
      logger.error(error);
    }

    try {
      await removeResults();
    } catch (error) {
      logger.error(error);
    }

    await generateTestUsers(
      newUsersCount,
      groupSize,
      numberOfGroups,
      testUsersCount
    );
  }

  if (options.games) {
    logger.info('Generate games');

    try {
      await removeGames();
    } catch (error) {
      logger.error(error);
    }

    try {
      await removeResults();
    } catch (error) {
      logger.error(error);
    }

    await createGames(newGamesCount, signupTimes);
  }

  if (options.signups) {
    logger.info('Generate signups');
    // TODO: Remove signups

    try {
      await removeResults();
    } catch (error) {
      logger.error(error);
    }

    await createSignups();
  }

  try {
    await db.gracefulExit();
  } catch (error) {
    logger.error(error);
  }
};

runGenerators().catch((error) => {
  logger.error(error);
});
