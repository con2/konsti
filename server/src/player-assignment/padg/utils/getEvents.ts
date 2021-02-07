import { Game } from 'common/typings/game';
import { Event } from 'typings/padgAssign.typings';

export const getEvents = (signedGames: readonly Game[]): Event[] => {
  return signedGames.map((signedGame) => {
    return {
      id: signedGame.gameId,
      min: signedGame.minAttendance,
      max: signedGame.maxAttendance,
      groups: [],
    };
  });
};
