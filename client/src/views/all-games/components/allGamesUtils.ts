import { Game } from "shared/typings/models/game";
import {
  getSignedGames,
  getUpcomingEnteredGames,
} from "client/utils/getUpcomingGames";
import { SelectedGame } from "shared/typings/models/user";
import { GroupMember } from "shared/typings/api/groups";

export const isAlreadySigned = (
  gameToCheck: Game,
  signedGames: readonly SelectedGame[],
  groupCode: string,
  serial: string,
  groupMembers: readonly GroupMember[]
): boolean => {
  const allSignedGames = getSignedGames(
    signedGames,
    groupCode,
    serial,
    groupMembers,
    true
  );

  return [...allSignedGames].some(
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
