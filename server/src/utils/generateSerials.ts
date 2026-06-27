import { db } from "server/db/mongodb";
import { saveSerials } from "server/features/serial/serialRepository";
import { logger } from "server/utils/logger";

const isInt = (n: string): boolean => Number.isInteger(Number(n));

const generateSerials = async (): Promise<void> => {
  const count = process.argv[2];
  if (!count || !isInt(count)) {
    logger.error(
      new Error('Give number parameter: "npm run generate-serials 10"'),
    );
  } else {
    try {
      await db.connectToDb();
    } catch (error) {
      logger.error(error);
    }

    try {
      await saveSerials(Number(count));
    } catch (error) {
      logger.error(new Error("Error saving serials", { cause: error }));
    }
  }

  try {
    await db.gracefulExit();
  } catch (error) {
    logger.error(error);
  }
};

try {
  await generateSerials();
} catch (error: unknown) {
  logger.error(error);
}
