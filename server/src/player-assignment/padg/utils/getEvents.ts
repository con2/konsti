import { Game } from 'shared/typings/models/game';
import { Event } from 'server/typings/padgAssign.typings';

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
