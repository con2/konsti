import { Game } from 'shared/typings/models/game';
import { SelectedGame } from 'shared/typings/models/user';

export const filterSelectedGames = (
  selectedGames: readonly SelectedGame[],
  signupTime: string
): readonly Game[] => {
  const selectedGameDetails = selectedGames.map(
    (selectedGame) => selectedGame.gameDetails
  );

  return selectedGameDetails.filter(
    (selectedGame) => selectedGame.startTime === signupTime
  );
};
