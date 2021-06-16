import { Game } from 'shared/typings/models/game';
import {
  getSignedGames,
  getUpcomingEnteredGames,
} from 'client/utils/getUpcomingGames';
import { SelectedGame } from 'shared/typings/models/user';
import { GroupMember } from 'shared/typings/api/groups';

export const isAlreadySigned = (
  gameToCheck: Game,
  signedGames: readonly SelectedGame[],
  groupCode: string,
  serial: string,
  groupMembers: readonly GroupMember[],
  enteredGames: readonly SelectedGame[]
): boolean => {
  const allSignedGames = getSignedGames(
    signedGames,
    groupCode,
    serial,
    groupMembers,
    true
  );
  const allEnteredGames = getUpcomingEnteredGames(enteredGames);

  return [...allSignedGames, ...allEnteredGames].some(
    (g: SelectedGame) => g.gameDetails.gameId === gameToCheck.gameId
  );
};
