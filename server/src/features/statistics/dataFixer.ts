import { Command } from "commander";
import { anonymizeData } from "./fixer-helpers/dataAnonymizer";
import { wildFix } from "./fixer-helpers/wildFix";
import { gameIdFix } from "./fixer-helpers/gameIdFix";
import { formatFeedbacks } from "./fixer-helpers/formatFeedbacks";
import { initializeDayjs } from "shared/utils/initializeDayjs";
import { getSimilarUsernames } from "server/features/statistics/similarUsernames";

const fixData = (): void => {
  initializeDayjs();

  const commander = new Command();

  commander
    .command("anonymize <year> <event>")
    .description("Anonymize users and results")
    .action(async (year: number, event: string) => {
      await anonymizeData(year, event);
    });

  commander
    .command("gameid <year> <event>")
    .description("Fix game ids for users and results")
    .action(async (year: number, event: string) => {
      await gameIdFix(year, event);
    });

  commander
    .command("wild <year> <event> <datatype>")
    .description("Implement new fix logic")
    .action(async (year: number, event: string, datatype: string) => {
      await wildFix(year, event, datatype);
    });

  commander
    .command("feedback-format <year> <event>")
    .description("Format feedbacks")
    .action((year: number, event: string) => {
      formatFeedbacks(year, event);
    });

  commander
    .command("similar-usernames <year> <event>")
    .description("Find similar usernames")
    .action((year: number, event: string) => {
      getSimilarUsernames(year, event);
    });

  if (process.argv.length < 4) {
    commander.help();
  }

  commander.parse(process.argv);
};

fixData();
