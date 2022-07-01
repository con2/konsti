import { db } from "server/db/mongodb";
import { updateGames } from "server/features/game/gamesService";
import { logger } from "server/utils/logger";

const loadKompassiDataToDb = async (): Promise<void> => {
  await db.connectToDb();
  await updateGames();
  await db.gracefulExit();
};

loadKompassiDataToDb().catch((error) => {
  logger.error(error);
});
