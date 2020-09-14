import moment from 'moment';
import { Game } from 'typings/game.typings';
import { Signup } from 'typings/user.typings';
import { getTime } from 'utils/getTime';

export const getUpcomingGames = (games: readonly Game[]): readonly Game[] => {
  const timeNow = getTime();

  const upcomingGames = games.filter((game) =>
    moment(game.startTime).isAfter(timeNow)
  );

  return upcomingGames;
};

export const getUpcomingSignedGames = (
  signedGames: readonly Signup[]
): readonly Signup[] => {
  const timeNow = getTime();

  const upcomingGames = signedGames.filter((signedGame) => {
    return moment(signedGame.gameDetails.startTime)
      .add(1, 'hours')
      .isAfter(timeNow);
  });

  return upcomingGames;
};

export const getUpcomingEnteredGames = (
  enteredGames: readonly Signup[]
): readonly Signup[] => {
  const timeNow = getTime();

  const upcomingGames = enteredGames.filter((enteredGame) =>
    moment(enteredGame.gameDetails.startTime).add(1, 'hours').isAfter(timeNow)
  );

  return upcomingGames;
};

export const getUpcomingFavorites = (
  favoritedGames: readonly Game[]
): readonly Game[] => {
  const timeNow = getTime();

  const upcomingGames = favoritedGames.filter((favoritedGame) =>
    moment(favoritedGame.startTime).add(1, 'hours').isAfter(timeNow)
  );

  return upcomingGames;
};
