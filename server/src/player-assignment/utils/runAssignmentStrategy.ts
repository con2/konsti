import { logger } from 'server/utils/logger';
import { groupAssignPlayers } from 'server/player-assignment/group/groupAssignPlayers';
import { munkresAssignPlayers } from 'server/player-assignment/munkres/munkresAssignPlayers';
import { padgAssignPlayers } from 'server/player-assignment/padg/padgAssignPlayers';
import { User } from 'server/typings/user.typings';
import { Game } from 'shared/typings/models/game';
import { PlayerAssignmentResult } from 'server/typings/result.typings';
import { AssignmentStrategy } from 'server/typings/config.typings';

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
