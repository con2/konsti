import _ from 'lodash';
import { config } from 'config';
import { Game } from 'typings/game.typings';
import { Signup } from 'typings/user.typings';

// Get games that have are not hidden, have signup open, and are not signed
export const filterAvailableGames = (
  games: readonly Game[],
  hiddenGames: readonly Game[],
  selectedGames: readonly Signup[],
  signupTime: string
): readonly Game[] => {
  const visibleGames = _.differenceBy(games, hiddenGames, 'gameId');

  const noSignupGames = config.noSignupGames;

  const signupOpenGames = visibleGames.filter((game) => {
    if (noSignupGames.includes(game.gameId)) return false;
    else return true;
  });

  const selectedGameDetails = selectedGames.map(
    (selectedGame) => selectedGame.gameDetails
  );

  const availableGames = _.differenceBy(
    signupOpenGames,
    selectedGameDetails,
    'gameId'
  );

  const availableGamesForStartTime = availableGames.filter(
    (nonSelectedGame) => nonSelectedGame.startTime === signupTime
  );

  return _.sortBy(availableGamesForStartTime, [
    (game) => game.title.toLowerCase(),
  ]);
};
