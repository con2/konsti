import { Command } from "commander";
import { logger } from "server/utils/logger";
import { db } from "server/db/mongodb";
import { runGenerators } from "server/test/test-data-generation/runGenerators";

const parseCliOptions = async (): Promise<void> => {
  const commander = new Command();

  commander
    .option("-u, --users", "Generate users")
    .option("-s, --signups", "Generate signups")
    .option("-e, --entered", "Generate entered games")
    .option("-g, --games", "Generate games")
    .option("-c, --clean", "Clean all data");

  const options = commander.opts();

  if (process.argv.length < 3) {
    commander.help();
  }

  commander.parse(process.argv);

  await db.connectToDb();

  await runGenerators(options, { closeDb: true });
};

parseCliOptions().catch((error) => {
  logger.error(error);
});
