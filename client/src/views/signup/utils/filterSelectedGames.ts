import { Signup } from 'client/typings/user.typings';
import { Game } from 'shared/typings/game';

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
