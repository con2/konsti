import fs from 'fs';
import { logger } from 'server/utils/logger';
import { FavoritedGame, SelectedGame, User } from 'shared/typings/models/user';
import { GameDoc } from 'server/typings/game.typings';
import { ResultsCollectionEntry } from 'server/typings/result.typings';
import { writeJson } from 'server/features/statistics/statsUtil';

export const gameIdFix = async (year: number, event: string): Promise<void> => {
  const users: User[] = JSON.parse(
    fs.readFileSync(
      `src/statistics/datafiles/${event}/${year}/users.json`,
      'utf8'
    )
  );

  logger.info(`Loaded ${users.length} users`);

  const results: ResultsCollectionEntry[] = JSON.parse(
    fs.readFileSync(
      `src/statistics/datafiles/${event}/${year}/results.json`,
      'utf8'
    )
  );

  logger.info(`Loaded ${results.length} results`);

  const games: GameDoc[] = JSON.parse(
    fs.readFileSync(
      `src/statistics/datafiles/${event}/${year}/games.json`,
      'utf8'
    )
  );

  logger.info(`Loaded ${games.length} games`);

  users.forEach((user) => {
    const tempFavoritedGames: FavoritedGame[] = [];
    const tempEnteredGames: SelectedGame[] = [];
    const tempSignedGames: SelectedGame[] = [];

    games.forEach((game) => {
      user.favoritedGames.forEach((favoritedGame) => {
        if (game._id === favoritedGame) {
          tempFavoritedGames.push({ gameId: game.gameId });
        }
      });
      user.enteredGames.forEach((enteredGame) => {
        if (game._id === enteredGame.gameDetails) {
          tempEnteredGames.push({
            ...enteredGame,
            gameDetails: game,
          });
        }
      });
      user.signedGames.forEach((signedGame) => {
        if (game._id === signedGame.gameDetails) {
          tempSignedGames.push({
            ...signedGame,
            gameDetails: game,
          });
        }
      });
    });
    user.favoritedGames = tempFavoritedGames;
    user.enteredGames = tempEnteredGames;
    user.signedGames = tempSignedGames;
  });

  results.forEach((result) => {
    games.forEach((game) => {
      result.results.forEach((userResult) => {
        if (game._id === userResult.enteredGame.gameDetails) {
          userResult.enteredGame = {
            ...userResult.enteredGame,
            gameDetails: game,
          };
        }
      });
    });
  });

  await writeJson(year, event, 'users', users);
  await writeJson(year, event, 'results', results);
};
