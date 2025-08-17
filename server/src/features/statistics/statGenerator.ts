import { Command } from "commander";
import { getUserStats } from "./statistics-helpers/getUserStats";
import { getProgramItemStats } from "./statistics-helpers/getProgramItemStats";
import { getResultsStats } from "./statistics-helpers/getResultsStats";
import { initializeDayjs } from "shared/utils/initializeDayjs";

const getStatistics = (): void => {
  initializeDayjs();

  const commander = new Command();

  commander
    .command("users <event> <year>")
    .description("Get user statisticss")
    .action((event: string, year: number) => {
      getUserStats(event, year);
    });

  commander
    .command("program-items <year> <event>")
    .description("Get program item statistics")
    .action((event: string, year: number) => {
      getProgramItemStats(event, year);
    });

  commander
    .command("results <year> <event>")
    .description("Get result statistics")
    .action((event: string, year: number) => {
      getResultsStats(event, year);
    });

  if (process.argv.length < 4) {
    commander.help();
  }

  commander.parse(process.argv);
};

getStatistics();
