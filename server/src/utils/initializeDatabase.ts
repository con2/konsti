import 'array-flat-polyfill';
import { logger } from 'server/utils/logger';
import { removeUsers } from 'server/features/user/userRepository';
import { removeResults } from 'server/features/results/resultsRepository';
import { removeGames, saveGames } from 'server/features/game/gameRepository';
import { removeSettings } from 'server/features/settings/settingsRepository';
import { db } from 'server/db/mongodb';
import {
  createAdminUser,
  createHelpUser,
  createTestUsers,
} from 'server/test/test-data-generation/generators/createUsers';
import { updateGames } from 'server/utils/updateGames';
import { kompassiGameMapper } from 'server/utils/kompassiGameMapper';

const ADMIN_PASSWORD = '';
const CREATE_TEST_USERS = true;

const initializeDatabase = async (): Promise<void> => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(`Data creation not allowed in production`);
  }

  await db.connectToDb();

  logger.info('Clean all data');
  await removeUsers();
  await removeGames();
  await removeResults();
  await removeSettings();

  logger.info('Create admin user');
  await createAdminUser(ADMIN_PASSWORD);

  logger.info('Create helper user');
  await createHelpUser();

  if (CREATE_TEST_USERS) {
    logger.info('Create test users');
    await createTestUsers(5);
  }

  logger.info('Download games from Kompassi');
  const kompassiGames = await updateGames();
  await saveGames(kompassiGameMapper(kompassiGames));

  await db.gracefulExit();
};

initializeDatabase().catch((error) => {
  logger.error(error);
});
