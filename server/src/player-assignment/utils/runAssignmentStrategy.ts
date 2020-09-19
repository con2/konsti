import { logger } from 'utils/logger';
import { groupAssignPlayers } from 'player-assignment/group/groupAssignPlayers';
import { munkresAssignPlayers } from 'player-assignment/munkres/munkresAssignPlayers';
import { padgAssignPlayers } from 'player-assignment/padg/padgAssignPlayers';
import { User } from 'typings/user.typings';
import { Game } from 'typings/game.typings';
import { PlayerAssignmentResult } from 'typings/result.typings';
import { AssignmentStrategy } from 'typings/config.typings';

export const runAssignmentStrategy = (
  players: readonly User[],
  games: readonly Game[],
  startingTime: string,
  assignmentStrategy: AssignmentStrategy
): PlayerAssignmentResult => {
  logger.info(
    `Received data for ${players.length} players and ${games.length} games`
  );

  logger.info(
    `Assigning players for games starting at ${startingTime.toString()}`
  );

  logger.info(`Assign strategy: ${assignmentStrategy}`);

  if (assignmentStrategy === 'munkres') {
    return munkresAssignPlayers(players, games, startingTime);
  } else if (assignmentStrategy === 'group') {
    return groupAssignPlayers(players, games, startingTime);
  } else if (assignmentStrategy === 'padg') {
    return padgAssignPlayers(players, games, startingTime);
  } else if (assignmentStrategy === 'group+padg') {
    const groupResult = groupAssignPlayers(players, games, startingTime);
    const padgResult = padgAssignPlayers(players, games, startingTime);

    logger.info(
      `Group result: ${groupResult.results.length} players, Padg result: ${padgResult.results.length} players`
    );

    if (groupResult.results.length > padgResult.results.length) {
      logger.info('----> Use Group Assign result');
      return groupResult;
    } else {
      logger.info('----> Use Padg Assign result');
      return padgResult;
    }
  } else {
    throw new Error('Invalid or missing "assignmentStrategy" config');
  }
};
