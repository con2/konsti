import { Command } from "commander";
import { anonymizeData } from "./fixer-helpers/dataAnonymizer";
import { wildFix } from "./fixer-helpers/wildFix";
import { formatJson } from "./fixer-helpers/formatJson";
import { formatFields } from "./fixer-helpers/formatFields";
import { initializeDayjs } from "shared/utils/initializeDayjs";
import { getSimilarUsernames } from "server/features/statistics/similarUsernames";
import { getMatchingEmails } from "server/features/statistics/matchingEmails";

const fixData = (): void => {
  initializeDayjs();

  const commander = new Command();

  commander
    .command("format <event> <year>")
    .description("Format json files with prettier")
    .action(async (event: string, year: number) => {
      await formatJson(event, year);
    });

  commander
    .command("format-fields <event> <year>")
    .description("Remove _id and __v fields and unwrap $date timestamps")
    .action(async (event: string, year: number) => {
      await formatFields(event, year);
    });

  commander
    .command("similar-usernames <event> <year>")
    .description("Find similar usernames")
    .action((event: string, year: number) => {
      getSimilarUsernames(event, year);
    });

  commander
    .command("matching-emails <event> <year>")
    .description("Find users with same email address")
    .action((event: string, year: number) => {
      getMatchingEmails(event, year);
    });

  commander
    .command("anonymize <event> <year>")
    .description("Anonymize users and results")
    .action(async (event: string, year: number) => {
      await anonymizeData(event, year);
    });

  commander
    .command("wild <event> <year> <datatype>")
    .description("Implement new fix logic")
    .action(async (event: string, year: number, datatype: string) => {
      await wildFix(event, year, datatype);
    });

  if (process.argv.length < 4) {
    commander.help();
  }

  commander.parse(process.argv);
};

fixData();
