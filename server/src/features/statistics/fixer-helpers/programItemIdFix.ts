import fs from "node:fs";
import { logger } from "server/utils/logger";
import { User } from "shared/types/models/user";
import { ProgramItemDoc } from "server/types/programItemTypes";
import { ResultsCollectionEntry } from "server/types/resultTypes";
import { writeJson } from "server/features/statistics/statsUtil";
import { config } from "shared/config";
import { DirectSignupDoc } from "server/features/direct-signup/directSignupTypes";
import { SettingsDoc } from "server/types/settingsTypes";

export const programItemIdFix = async (
  year: number,
  event: string,
): Promise<void> => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const users: User[] = JSON.parse(
    fs.readFileSync(
      `${config.server().statsDataDir}/${event}/${year}/users.json`,
      "utf8",
    ),
  );

  logger.info(`Loaded ${users.length} users`);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const results: ResultsCollectionEntry[] = JSON.parse(
    fs.readFileSync(
      `${config.server().statsDataDir}/${event}/${year}/results.json`,
      "utf8",
    ),
  );

  logger.info(`Loaded ${results.length} results`);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const programItems: ProgramItemDoc[] = JSON.parse(
    fs.readFileSync(
      `${config.server().statsDataDir}/${event}/${year}/program-items.json`,
      "utf8",
    ),
  );

  logger.info(`Loaded ${programItems.length} program items`);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const directSignups: DirectSignupDoc[] = JSON.parse(
    fs.readFileSync(
      `${config.server().statsDataDir}/${event}/${year}/direct-signups.json`,
      "utf8",
    ),
  );

  logger.info(`Loaded ${programItems.length} program items`);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const settings: SettingsDoc[] = JSON.parse(
    fs.readFileSync(
      `${config.server().statsDataDir}/${event}/${year}/settings.json`,
      "utf8",
    ),
  );

  logger.info(`Loaded ${settings.length} program items`);

  users.map((user) => {
    const tempLotterySignups = user.lotterySignups.map((lotterySignup) => {
      const matchingProgramItem = programItems.find(
        (programItem) =>
          programItem.programItemId === lotterySignup.programItemId,
      );
      if (!matchingProgramItem) {
        logger.error(
          `Lottery signup: program item for id ${JSON.stringify(lotterySignup)} not found`,
        );
        return {
          ...lotterySignup,
          programItem: { programItemId: "<canceled>" },
        };
      }
      return {
        ...lotterySignup,
        programItem: {
          programItemId: matchingProgramItem.programItemId,
        },
      };
    });

    user.lotterySignups = tempLotterySignups;
  });

  results.map((result) => {
    result.results.map((userResult) => {
      const matchingProgramItem = programItems.find((programItem) => {
        return (
          programItem.programItemId ===
          userResult.assignmentSignup.programItemId
        );
      });

      if (!matchingProgramItem) {
        logger.error(
          `Results: program item for id ${JSON.stringify(
            userResult.assignmentSignup.programItemId,
          )} not found`,
        );
        userResult.assignmentSignup = {
          ...userResult.assignmentSignup,
          programItemId: "<canceled>",
        };
        return;
      }

      userResult.assignmentSignup = {
        ...userResult.assignmentSignup,
        programItemId: matchingProgramItem.programItemId,
      };
    });
  });

  directSignups.map((signup) => {
    programItems.map((programItem) => {
      if (programItem.programItemId === signup.programItemId) {
        signup.programItemId = programItem.programItemId;
      }
    });
  });

  const tempHiddenProgramItemIds: string[] = [];

  settings.map((setting) => {
    programItems.map((programItem) => {
      setting.hiddenProgramItemIds.map((hiddenProgramItemId) => {
        if (programItem.programItemId === hiddenProgramItemId) {
          tempHiddenProgramItemIds.push(programItem.programItemId);
        }
      });
    });
  });

  settings[0].hiddenProgramItemIds = tempHiddenProgramItemIds;

  await writeJson(year, event, "users", users);
  await writeJson(year, event, "results", results);
  await writeJson(year, event, "direct-signups", directSignups);
  await writeJson(year, event, "settings", settings);
};
