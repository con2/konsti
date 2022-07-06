import { Command } from "commander";
import { anonymizeData } from "./fixer-helpers/dataAnonymizer";
import { wildFix } from "./fixer-helpers/wildFix";
import { gameIdFix } from "./fixer-helpers/gameIdFix";
import { formatFeedbacks } from "./fixer-helpers/formatFeedbacks";

const fixData = (): void => {
  const commander = new Command();

  commander
    .command("anonymize <year> <event>")
    .description("Anonymize users and results")
    .action((year: number, event: string) => {
      anonymizeData(year, event);
    });

  commander
    .command("gameid <year> <event>")
    .description("Fix game ids for users and results")
    .action((year: number, event: string) => {
      gameIdFix(year, event);
    });

  commander
    .command("wild <year> <event> <datatype>")
    .description("Implement new fix logic")
    .action((year: number, event: string, datatype: string) => {
      wildFix(year, event, datatype);
    });

  commander
    .command("feedback-format <year> <event>")
    .description("Format feedbacks")
    .action((year: number, event: string) => {
      formatFeedbacks(year, event);
    });

  if (process.argv.length < 4) {
    commander.help();
  }

  commander.parse(process.argv);
};

fixData();
