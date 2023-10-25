import fs from "fs";
import _ from "lodash";
import { logger } from "server/utils/logger";
import { User } from "shared/typings/models/user";
import { GameDoc } from "server/typings/game.typings";
import { ResultsCollectionEntry } from "server/typings/result.typings";
import { writeJson } from "server/features/statistics/statsUtil";
import { config } from "shared/config/config";
import { Game } from "shared/typings/models/game";
import { SignupDoc } from "server/features/signup/signup.typings";
import { SettingsDoc } from "server/typings/settings.typings";

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

  users.forEach((user) => {
    const tempFavoritedGames = user.favoritedGames.flatMap((favoritedGame) => {
      const matchingGame = games.find((game) => game._id === favoritedGame);
      if (!matchingGame) {
        logger.error(
          `Program item for id ${JSON.stringify(favoritedGame)} not found`,
        );
        return [];
      }
      return { gameId: matchingGame.gameId };
    });

    const tempSignedGames = user.signedGames.flatMap((signedGame) => {
      const matchingGame = games.find(
        (game) => game._id === signedGame.gameDetails,
      );
      if (!matchingGame) {
        logger.error(
          `Program item for id ${JSON.stringify(signedGame)} not found`,
        );
        return [];
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

  results.forEach((result) => {
    games.forEach((game) => {
      result.results.forEach((userResult) => {
        if (_.isEqual(game._id, userResult.enteredGame.gameDetails)) {
          userResult.enteredGame = {
            ...userResult.enteredGame,
            // @ts-expect-error: We don't want whole game details
            gameDetails: { gameId: game.gameId },
          };
        }
      });
    });
  });

  signups.forEach((signup) => {
    games.forEach((game) => {
      if (_.isEqual(game._id, signup.game)) {
        // @ts-expect-error: We don't want whole game details
        signup.game = { gameId: game.gameId };
      }
    });
  });

  const tempHiddenGames: Game[] = [];

  settings.forEach((setting) => {
    games.forEach((game) => {
      setting.hiddenGames.forEach((hiddenGame) => {
        if (_.isEqual(game._id, hiddenGame)) {
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
