import { db } from "server/db/mongodb";
import { saveSerials } from "server/features/serial/serialRepository";
import { logger } from "server/utils/logger";

const isInt = (n: string): boolean => Number.parseInt(n, 10) % 1 === 0;

const generateSerials = async (): Promise<void> => {
  const count = process.argv[2];
  if (!count || !isInt(count)) {
    logger.error(
      "%s",
      new Error('Give number parameter: "npm run generate-serials 10"'),
    );
  } else {
    try {
      await db.connectToDb();
    } catch (error) {
      logger.error("%s", error);
    }

    try {
      await saveSerials(Number.parseInt(count, 10));
    } catch (error) {
      logger.error("Error saving serials: %s", error);
    }
  }

  try {
    await db.gracefulExit();
  } catch (error) {
    logger.error("%s", error);
  }
};

generateSerials().catch((error: unknown) => {
  logger.error("%s", error);
});
