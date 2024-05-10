import { Command } from "commander";
import { logger } from "server/utils/logger";
import { db } from "server/db/mongodb";
import { runGenerators } from "server/test/test-data-generation/runGenerators";

const parseCliOptions = async (): Promise<void> => {
  const commander = new Command();

  commander
    .option("-u, --users", "Generate users")
    .option("-l, --lottery", "Generate lottery signups")
    .option("-d, --direct", "Generate direct signups")
    .option("-p, --program", "Generate program items")
    .option("-o, --log", "Generate event log items")
    .option("-c, --clean", "Clean all data");

  const options = commander.opts();

  if (process.argv.length < 3) {
    commander.help();
  }

  commander.parse(process.argv);

  await db.connectToDb();

  await runGenerators(options, { closeDb: true });
};

parseCliOptions().catch((error: unknown) => {
  logger.error(error);
});
