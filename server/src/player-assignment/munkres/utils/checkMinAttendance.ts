import { logger } from 'utils/logger';
import { Game, GameWithPlayerCount } from 'typings/game.typings';
import { StringNumberObject } from 'typings/common.typings';

export const checkMinAttendance = (
  results: readonly number[][],
  signedGames: readonly Game[]
): readonly GameWithPlayerCount[] => {
  // Check that game minAttendance is fullfilled
  const gameIds = [] as string[];

  for (let i = 0; i < results.length; i += 1) {
    // Row determines the game
    const selectedRow = results[i][0];

    // Figure what games the row numbers are
    let attendanceRange = 0;
    for (let j = 0; j < signedGames.length; j += 1) {
      attendanceRange += signedGames[j].maxAttendance;
      // Found game
      if (selectedRow < attendanceRange) {
        gameIds.push(signedGames[j].gameId);
        break;
      }
    }
  }

  const counts: StringNumberObject = {};
  gameIds.forEach((x) => {
    counts[x] = (counts[x] || 0) + 1;
  });

  // Find games with too few players
  const gamesWithTooFewPlayers: GameWithPlayerCount[] = [];
  signedGames.forEach((signedGame) => {
    if (counts[signedGame.gameId] < signedGame.minAttendance) {
      gamesWithTooFewPlayers.push({
        game: signedGame,
        players: counts[signedGame.gameId],
      });
      logger.info(
        `Too few people for game "${signedGame.title}" (${
          counts[signedGame.gameId]
        }/${signedGame.minAttendance})`
      );
    }
  });

  return gamesWithTooFewPlayers;
};
