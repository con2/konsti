import { Command } from "commander";
import { logger } from "server/utils/logger";
import { db } from "server/db/mongodb";
import { runGenerators } from "server/test/test-data-generation/runGenerators";

const generateTestData = async (): Promise<void> => {
  const commander = new Command();

  commander
    .option("-u, --users", "Generate users")
    .option("-l, --lotterySignups", "Generate lottery signups")
    .option("-d, --directSignups", "Generate direct signups")
    .option("-p, --programItems", "Generate program items")
    .option("-o, --eventLog", "Generate event log items")
    .option("-c, --clean", "Clean all data");

  const options = commander.opts();

  if (process.argv.length < 3) {
    commander.help();
  }

  commander.parse(process.argv);

  await db.connectToDb();

  await runGenerators(options, { closeDb: true });
};

generateTestData().catch((error: unknown) => {
  logger.error("%s", error);
});
