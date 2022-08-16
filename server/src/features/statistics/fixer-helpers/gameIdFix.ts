import fs from "fs";
import _ from "lodash";
import { logger } from "server/utils/logger";
import { SelectedGame, User } from "shared/typings/models/user";
import { GameDoc } from "server/typings/game.typings";
import { ResultsCollectionEntry } from "server/typings/result.typings";
import { writeJson } from "server/features/statistics/statsUtil";
import { config } from "server/config";
import { Game } from "shared/typings/models/game";
import { SignupDoc } from "server/features/signup/signup.typings";
import { SettingsDoc } from "server/typings/settings.typings";

export const gameIdFix = (year: number, event: string): void => {
  const users: User[] = JSON.parse(
    fs.readFileSync(
      `${config.statsDataDir}/${event}/${year}/users.json`,
      "utf8"
    )
  );

  logger.info(`Loaded ${users.length} users`);

  const results: ResultsCollectionEntry[] = JSON.parse(
    fs.readFileSync(
      `${config.statsDataDir}/${event}/${year}/results.json`,
      "utf8"
    )
  );

  logger.info(`Loaded ${results.length} results`);

  const games: GameDoc[] = JSON.parse(
    fs.readFileSync(
      `${config.statsDataDir}/${event}/${year}/games.json`,
      "utf8"
    )
  );

  logger.info(`Loaded ${games.length} games`);

  const signups: SignupDoc[] = JSON.parse(
    fs.readFileSync(
      `${config.statsDataDir}/${event}/${year}/signups.json`,
      "utf8"
    )
  );

  logger.info(`Loaded ${games.length} games`);

  const settings: SettingsDoc[] = JSON.parse(
    fs.readFileSync(
      `${config.statsDataDir}/${event}/${year}/settings.json`,
      "utf8"
    )
  );

  logger.info(`Loaded ${settings.length} games`);

  users.forEach((user) => {
    const tempFavoritedGames: Game[] = [];
    const tempSignedGames: SelectedGame[] = [];

    games.forEach((game) => {
      user.favoritedGames.forEach((favoritedGame) => {
        if (_.isEqual(game._id, favoritedGame)) {
          // @ts-expect-error: We don't want whole game details
          tempFavoritedGames.push({ gameId: game.gameId });
        }
      });

      user.signedGames.forEach((signedGame) => {
        if (_.isEqual(game._id, signedGame.gameDetails)) {
          tempSignedGames.push({
            ...signedGame,
            // @ts-expect-error: We don't want whole game details
            gameDetails: { gameId: game.gameId },
          });
        }
      });
    });

    user.favoritedGames = tempFavoritedGames;
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

  writeJson(year, event, "users", users);
  writeJson(year, event, "results", results);
  writeJson(year, event, "signups", signups);
  writeJson(year, event, "settings", settings);
};
