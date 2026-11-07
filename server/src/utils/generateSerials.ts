import { db } from "server/db/mongodb";
import { saveSerials } from "server/features/serial/serialRepository";
import { logger } from "server/utils/logger";
import { runScript } from "server/utils/runScript";

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
  const saveSerialsResult = await saveSerials(Number(count));
  if (!saveSerialsResult.ok) {
    // eslint-disable-next-line no-restricted-syntax -- Serial generation script
    throw new Error(`Saving serials failed: ${saveSerialsResult.error}`);
  }
};

await runScript("Failed to generate serials", generateSerials);
