import { Command } from "commander";
import { getUserStats } from "./statistics-helpers/getUserStats";
import { getProgramItemStats } from "./statistics-helpers/getProgramItemStats";
import { getResultsStats } from "./statistics-helpers/getResultsStats";
import { initializeDayjs } from "shared/utils/initializeDayjs";

const getStatistics = (): void => {
  initializeDayjs();

  const commander = new Command();

  commander
    .command("users <year> <event>")
    .description("Get user statisticss")
    .action((year: number, event: string) => {
      getUserStats(year, event);
    });

  commander
    .command("program-items <year> <event>")
    .description("Get program item statistics")
    .action((year: number, event: string) => {
      getProgramItemStats(year, event);
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

getStatistics();
