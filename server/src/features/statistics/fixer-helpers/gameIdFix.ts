import fs from "fs";
import { isEqual } from "lodash-es";
import { logger } from "server/utils/logger";
import { User } from "shared/types/models/user";
import { GameDoc } from "server/types/gameTypes";
import { ResultsCollectionEntry } from "server/types/resultTypes";
import { writeJson } from "server/features/statistics/statsUtil";
import { config } from "shared/config";
import { Game } from "shared/types/models/game";
import { SignupDoc } from "server/features/signup/signupTypes";
import { SettingsDoc } from "server/types/settingsTypes";

export const gameIdFix = async (year: number, event: string): Promise<void> => {
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

  const games: GameDoc[] = JSON.parse(
    fs.readFileSync(
      `${config.server().statsDataDir}/${event}/${year}/games.json`,
      "utf8",
    ),
  );

  logger.info(`Loaded ${games.length} games`);

  const signups: SignupDoc[] = JSON.parse(
    fs.readFileSync(
      `${config.server().statsDataDir}/${event}/${year}/signups.json`,
      "utf8",
    ),
  );

  logger.info(`Loaded ${games.length} games`);

  const settings: SettingsDoc[] = JSON.parse(
    fs.readFileSync(
      `${config.server().statsDataDir}/${event}/${year}/settings.json`,
      "utf8",
    ),
  );

  logger.info(`Loaded ${settings.length} games`);

  users.map((user) => {
    const tempFavoritedGames = user.favoritedGames.map((favoritedGame) => {
      const matchingGame = games.find(
        // @ts-expect-error: $oid not in interface
        (game) => game._id.$oid === favoritedGame.$oid,
      );
      if (!matchingGame) {
        logger.error(
          `Favorited: program item for id ${JSON.stringify(
            favoritedGame,
          )} not found`,
        );
        return { gameId: "<canceled>" };
      }
      return { gameId: matchingGame.gameId };
    });

    const tempSignedGames = user.signedGames.map((signedGame) => {
      const matchingGame = games.find(
        // @ts-expect-error: $oid not in interface
        (game) => game._id.$oid === signedGame.gameDetails.$oid,
      );
      if (!matchingGame) {
        logger.error(
          `Signed: program item for id ${JSON.stringify(signedGame)} not found`,
        );
        return {
          ...signedGame,
          gameDetails: { gameId: "<canceled>" },
        };
      }
      return {
        ...signedGame,
        gameDetails: { gameId: matchingGame.gameId },
      };
    });

    // @ts-expect-error: We don't want whole game details
    user.favoritedGames = tempFavoritedGames;
    // @ts-expect-error: We don't want whole game details
    user.signedGames = tempSignedGames;
  });

  results.map((result) => {
    result.results.map((userResult) => {
      const matchingGame = games.find((game) => {
        return isEqual(game._id, userResult.enteredGame.gameDetails);
      });

      if (!matchingGame) {
        logger.error(
          `Results: program item for id ${JSON.stringify(
            userResult.enteredGame.gameDetails,
          )} not found`,
        );
        userResult.enteredGame = {
          ...userResult.enteredGame,
          // @ts-expect-error: We don't want whole game details
          gameDetails: { gameId: "<canceled>" },
        };
        return;
      }

      userResult.enteredGame = {
        ...userResult.enteredGame,
        // @ts-expect-error: We don't want whole game details
        gameDetails: { gameId: matchingGame.gameId },
      };
    });
  });

  signups.map((signup) => {
    games.map((game) => {
      if (isEqual(game._id, signup.game)) {
        // @ts-expect-error: We don't want whole game details
        signup.game = { gameId: game.gameId };
      }
    });
  });

  const tempHiddenGames: Game[] = [];

  settings.map((setting) => {
    games.map((game) => {
      setting.hiddenGames.map((hiddenGame) => {
        if (isEqual(game._id, hiddenGame)) {
          // @ts-expect-error: We don't want whole game details
          tempHiddenGames.push({ gameId: game.gameId });
        }
      });
    });
  });

  settings[0].hiddenGames = tempHiddenGames;

  await writeJson(year, event, "users", users);
  await writeJson(year, event, "results", results);
  await writeJson(year, event, "signups", signups);
  await writeJson(year, event, "settings", settings);
};
