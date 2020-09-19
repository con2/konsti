import { Signup } from 'typings/user.typings';
import { Game } from 'typings/game.typings';

export const filterSelectedGames = (
  selectedGames: readonly Signup[],
  signupTime: string
): readonly Game[] => {
  const selectedGameDetails = selectedGames.map(
    (selectedGame) => selectedGame.gameDetails
  );

  return selectedGameDetails.filter(
    (selectedGame) => selectedGame.startTime === signupTime
  );
};
