import { Command } from "commander";
import { getDirectSignupStats } from "server/features/statistics/statistics-helpers/getDirectSignupStats";
import { getProgramItemStats } from "./statistics-helpers/getProgramItemStats";
import { getResultsStats } from "./statistics-helpers/getResultsStats";
import { getUserStats } from "./statistics-helpers/getUserStats";

const getStatistics = (): void => {
  const commander = new Command();

  commander
    .command("users <event> <year>")
    .description("Get user statistics")
    .action((event: string, year: number) => {
      getUserStats(event, year);
    });

  commander
    .command("direct-signups <event> <year>")
    .description("Get direct sign-up statistics")
    .action((event: string, year: number) => {
      getDirectSignupStats(event, year);
    });

  commander
    .command("program-items <event> <year>")
    .description("Get program item statistics")
    .action((event: string, year: number) => {
      getProgramItemStats(event, year);
    });

  commander
    .command("results <event> <year>")
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
