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
  const users: User[] = JSON.parse(
    fs.readFileSync(
      `${config.server().statsDataDir}/${event}/${year}/users.json`,
      "utf8",
    ),
  );

  logger.info(`Loaded ${users.length} users`);

  const results: ResultsCollectionEntry[] = JSON.parse(
    fs.readFileSync(
      `${config.server().statsDataDir}/${event}/${year}/results.json`,
      "utf8",
    ),
  );

  logger.info(`Loaded ${results.length} results`);

  const programItems: ProgramItemDoc[] = JSON.parse(
    fs.readFileSync(
      `${config.server().statsDataDir}/${event}/${year}/program-items.json`,
      "utf8",
    ),
  );

  logger.info(`Loaded ${programItems.length} program items`);

  const directSignups: DirectSignupDoc[] = JSON.parse(
    fs.readFileSync(
      `${config.server().statsDataDir}/${event}/${year}/direct-signups.json`,
      "utf8",
    ),
  );

  logger.info(`Loaded ${programItems.length} program items`);

  const settings: SettingsDoc[] = JSON.parse(
    fs.readFileSync(
      `${config.server().statsDataDir}/${event}/${year}/settings.json`,
      "utf8",
    ),
  );

  logger.info(`Loaded ${settings.length} program items`);

  users.map((user) => {
    const tempFavoritedProgramItems = user.favoritedProgramItems.map(
      (favoritedGame) => {
        const matchingGame = programItems.find(
          // @ts-expect-error: $oid not in interface
          (game) => game._id.$oid === favoritedGame.$oid,
        );
        if (!matchingGame) {
          logger.error(
            `Favorited: program item for id ${JSON.stringify(
              favoritedGame,
            )} not found`,
          );
          return { programItemId: "<canceled>" };
        }
        return { programItemId: matchingGame.programItemId };
      },
    );

    const tempLotterySignups = user.lotterySignups.map((lotterySignup) => {
      const matchingGame = programItems.find(
        // @ts-expect-error: $oid not in interface
        (game) => game._id.$oid === lotterySignup.programItemDetails.$oid,
      );
      if (!matchingGame) {
        logger.error(
          `Lottery signup: program item for id ${JSON.stringify(lotterySignup)} not found`,
        );
        return {
          ...lotterySignup,
          programItemDetails: { programItemId: "<canceled>" },
        };
      }
      return {
        ...lotterySignup,
        programItemDetails: { programItemId: matchingGame.programItemId },
      };
    });

    // @ts-expect-error: We don't want whole program item details
    user.favoritedProgramItems = tempFavoritedProgramItems;
    // @ts-expect-error: We don't want whole program item details
    user.lotterySignups = tempLotterySignups;
  });

  results.map((result) => {
    result.results.map((userResult) => {
      const matchingGame = programItems.find((game) => {
        return isEqual(game._id, userResult.directSignup.programItemDetails);
      });

      if (!matchingGame) {
        logger.error(
          `Results: program item for id ${JSON.stringify(
            userResult.directSignup.programItemDetails,
          )} not found`,
        );
        userResult.directSignup = {
          ...userResult.directSignup,
          // @ts-expect-error: We don't want whole program item details
          programItemDetails: { programItemId: "<canceled>" },
        };
        return;
      }

      userResult.directSignup = {
        ...userResult.directSignup,
        // @ts-expect-error: We don't want whole program item details
        programItemDetails: { programItemId: matchingGame.programItemId },
      };
    });
  });

  directSignups.map((signup) => {
    programItems.map((game) => {
      if (isEqual(game._id, signup.programItem)) {
        // @ts-expect-error: We don't want whole program item details
        signup.programItem = { programItemId: game.programItemId };
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
  await writeJson(year, event, "signups", directSignups);
  await writeJson(year, event, "settings", settings);
};
