import { Game } from 'shared/typings/game';
import { randomAssignEvent } from 'server/typings/padgRandomAssign.typings';

export const getRandomAssignEvents = (
  signedGames: readonly Game[]
): randomAssignEvent[] => {
  return signedGames.map((signedGame) => {
    return {
      id: signedGame.gameId,
      min: signedGame.minAttendance,
      max: signedGame.maxAttendance,
      groups: [],
    };
  });
};
