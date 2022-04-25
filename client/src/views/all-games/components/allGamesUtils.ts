import { Game } from "shared/typings/models/game";
import { getUpcomingEnteredGames } from "client/utils/getUpcomingGames";
import { SelectedGame } from "shared/typings/models/user";

export const isAlreadySigned = (
  gameToCheck: Game,
  signedGames: readonly SelectedGame[]
): boolean => {
  return [...signedGames].some(
    (g: SelectedGame) => g.gameDetails.gameId === gameToCheck.gameId
  );
};

export const isAlreadyEntered = (
  gameToCheck: Game,
  enteredGames: readonly SelectedGame[]
): boolean => {
  const allEnteredGames = getUpcomingEnteredGames(enteredGames);

  return [...allEnteredGames].some(
    (g: SelectedGame) => g.gameDetails.gameId === gameToCheck.gameId
  );
};
