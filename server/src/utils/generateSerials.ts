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
    process.exitCode = 1;
    return;
  }

  await db.connectToDb();
  await saveSerials(Number(count));
  await db.gracefulExit();
};

try {
  await generateSerials();
} catch (error: unknown) {
  logger.error(new Error("Failed to generate serials", { cause: error }));
  process.exitCode = 1;
  await db.gracefulExit();
}
