import { db } from 'server/db/mongodb';
import { storeGames } from 'server/features/game/gamesService';
import { logger } from 'server/utils/logger';

const loadKompassiDataToDb = async (): Promise<void> => {
  await db.connectToDb();
  await storeGames();
  await db.gracefulExit();
};

loadKompassiDataToDb().catch((error) => {
  logger.error(error);
});
