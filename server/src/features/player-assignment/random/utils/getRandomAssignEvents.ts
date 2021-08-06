import { Game } from "shared/typings/models/game";
import { RandomAssignEvent } from "server/typings/padgRandomAssign.typings";

export const getRandomAssignEvents = (
  signedGames: readonly Game[]
): RandomAssignEvent[] => {
  return signedGames.map((signedGame) => {
    return {
      id: signedGame.gameId,
      min: signedGame.minAttendance,
      max: signedGame.maxAttendance,
      groups: [],
    };
  });
};
