import fs from "fs";
import { isEqual } from "lodash-es";
import { logger } from "server/utils/logger";
import { User } from "shared/types/models/user";
import { ProgramItemDoc } from "server/types/programItemTypes";
import { ResultsCollectionEntry } from "server/types/resultTypes";
import { writeJson } from "server/features/statistics/statsUtil";
import { config } from "shared/config";
import { ProgramItem } from "shared/types/models/programItem";
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
          // @ts-expect-error: $oid not in interface
          programItem._id.$oid === lotterySignup.programItem.$oid,
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

    // @ts-expect-error: We don't want whole program item details
    user.lotterySignups = tempLotterySignups;
  });

  results.map((result) => {
    result.results.map((userResult) => {
      const matchingProgramItem = programItems.find((programItem) => {
        return isEqual(programItem._id, userResult.directSignup.programItem);
      });

      if (!matchingProgramItem) {
        logger.error(
          `Results: program item for id ${JSON.stringify(
            userResult.directSignup.programItem,
          )} not found`,
        );
        userResult.directSignup = {
          ...userResult.directSignup,
          // @ts-expect-error: We don't want whole program item details
          programItem: { programItemId: "<canceled>" },
        };
        return;
      }

      userResult.directSignup = {
        ...userResult.directSignup,
        // @ts-expect-error: We don't want whole program item details
        programItem: {
          programItemId: matchingProgramItem.programItemId,
        },
      };
    });
  });

  directSignups.map((signup) => {
    programItems.map((programItem) => {
      if (isEqual(programItem._id, signup.programItem)) {
        // @ts-expect-error: We don't want whole program item details
        signup.programItem = { programItemId: programItem.programItemId };
      }
    });
  });

  const tempHiddenProgramItems: ProgramItem[] = [];

  settings.map((setting) => {
    programItems.map((programItem) => {
      setting.hiddenProgramItems.map((hiddenProgramItem) => {
        if (isEqual(programItem._id, hiddenProgramItem)) {
          // @ts-expect-error: We don't want whole program item details
          tempHiddenProgramItems.push({
            programItemId: programItem.programItemId,
          });
        }
      });
    });
  });

  settings[0].hiddenProgramItems = tempHiddenProgramItems;

  await writeJson(year, event, "users", users);
  await writeJson(year, event, "results", results);
  await writeJson(year, event, "direct-signups", directSignups);
  await writeJson(year, event, "settings", settings);
};
