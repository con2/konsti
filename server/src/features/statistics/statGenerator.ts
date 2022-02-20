import { Command } from "commander";
import { getUserStats } from "./statistics-helpers/getUserStats";
import { getGameStats } from "./statistics-helpers/getGameStats";
import { getResultsStats } from "./statistics-helpers/getResultsStats";

const fixData = (): void => {
  const commander = new Command();

  commander
    .command("users <year> <event>")
    .description("Get user statisticss")
    .action(async (year: number, event: string) => {
      await getUserStats(year, event);
    });

  commander
    .command("games <year> <event>")
    .description("Get game statistics")
    .action(async (year: number, event: string) => {
      await getGameStats(year, event);
    });

  commander
    .command("results <year> <event>")
    .description("Get result statistics")
    .action(async (year: number, event: string) => {
      await getResultsStats(year, event);
    });

  if (process.argv.length < 4) {
    commander.help();
  }

  commander.parse(process.argv);
};

fixData();
