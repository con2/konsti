import { Command } from "commander";
import { getUserStats } from "./statistics-helpers/getUserStats";
import { getGameStats } from "./statistics-helpers/getGameStats";
import { getResultsStats } from "./statistics-helpers/getResultsStats";

const fixData = (): void => {
  const commander = new Command();

  commander
    .command("users <year> <event>")
    .description("Get user statisticss")
    .action((year: number, event: string) => {
      getUserStats(year, event);
    });

  commander
    .command("games <year> <event>")
    .description("Get game statistics")
    .action((year: number, event: string) => {
      getGameStats(year, event);
    });

  commander
    .command("results <year> <event>")
    .description("Get result statistics")
    .action((year: number, event: string) => {
      getResultsStats(year, event);
    });

  if (process.argv.length < 4) {
    commander.help();
  }

  commander.parse(process.argv);
};

fixData();
