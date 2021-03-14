import { logger } from 'server/utils/logger';
import { runGroupAssignment } from 'server/player-assignment/group/utils/runGroupAssignment';
import { config } from 'server/config';
import { User, UserArray } from 'server/typings/user.typings';
import { Game } from 'shared/typings/game';
import {
  AssignmentStrategyResult,
  Result,
} from 'server/typings/result.typings';

export const assignGroups = (
  selectedPlayers: readonly User[],
  signedGames: readonly Game[],
  playerGroups: readonly UserArray[]
): AssignmentStrategyResult => {
  const { GROUP_ASSIGNMENT_ROUNDS } = config;

  let bestScore = 0;
  let players = 0;
  let games = 0;
  let bestResult = [] as readonly Result[];

  for (let i = 0; i < GROUP_ASSIGNMENT_ROUNDS; i++) {
    const result = runGroupAssignment(playerGroups, signedGames);
    if (result.score > bestScore) {
      bestScore = result.score;
      bestResult = result.signupResults;
      players = result.playerCounter;
      games = result.gameCounter;
      logger.debug(`New best score: ${bestScore}`);
    }
  }

  const returnMessage = `Group Assign Result - Players: ${players}/${
    selectedPlayers.length
  } (${Math.round(
    (players / selectedPlayers.length) * 100
  )}%), Games: ${games}/${signedGames.length} (${Math.round(
    (games / signedGames.length) * 100
  )}%)`;

  return { results: bestResult, message: returnMessage };
};
