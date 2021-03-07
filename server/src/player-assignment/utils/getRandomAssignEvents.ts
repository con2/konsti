import { Game } from 'typings/game.typings';
import { randomAssignEvent } from 'typings/padgRandomAssign.typings';

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
