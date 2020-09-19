import 'array-flat-polyfill';
import commander from 'commander';
import faker from 'faker';
import { logger } from 'utils/logger';
import { db } from 'db/mongodb';
import {
  createIndividualUsers,
  createAdminUser,
  createTestUsers,
  createUsersInGroup,
  createHelpUser,
} from 'test/test-data-generation/generators/createUsers';
import { createGames } from 'test/test-data-generation/generators/createGames';
import { createSignups } from 'test/test-data-generation/generators/createSignups';

const runGenerators = async (): Promise<void> => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(`Data creation not allowed in production`);
  }

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

  if (process.argv.length < 3) {
    commander.help();
  }

  commander.parse(process.argv);

  try {
    await db.connectToDb();
  } catch (error) {
    logger.error(error);
  }

  if (commander.clean) {
    logger.info('Clean all data');

    try {
      await db.user.removeUsers();
    } catch (error) {
      logger.error(error);
    }

    try {
      await db.game.removeGames();
    } catch (error) {
      logger.error(error);
    }

    try {
      await db.results.removeResults();
    } catch (error) {
      logger.error(error);
    }

    try {
      await db.settings.removeSettings();
    } catch (error) {
      logger.error(error);
    }
  }

  if (commander.users) {
    logger.info('Generate users');

    try {
      await db.user.removeUsers();
    } catch (error) {
      logger.error(error);
    }

    try {
      await db.results.removeResults();
    } catch (error) {
      logger.error(error);
    }

    await createAdminUser();
    await createHelpUser();

    if (testUsersCount) await createTestUsers(testUsersCount);
    if (newUsersCount) await createIndividualUsers(newUsersCount);

    for (let i = 0; i < numberOfGroups; i++) {
      const randomGroupCode = faker.random.number().toString();
      await createUsersInGroup(groupSize, randomGroupCode);
    }
  }

  if (commander.games) {
    logger.info('Generate games');

    try {
      await db.game.removeGames();
    } catch (error) {
      logger.error(error);
    }

    try {
      await db.results.removeResults();
    } catch (error) {
      logger.error(error);
    }

    await createGames(newGamesCount, signupTimes);
  }

  if (commander.signups) {
    logger.info('Generate signups');
    // TODO: Remove signups

    try {
      await db.results.removeResults();
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
