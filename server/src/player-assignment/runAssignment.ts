import { logger } from 'server/utils/logger';
import { config } from 'server/config';
import { runAssignmentStrategy } from 'server/player-assignment/utils/runAssignmentStrategy';
import { removeInvalidSignupsFromUsers } from 'server/player-assignment/utils/removeInvalidSignupsFromUsers';
import { PlayerAssignmentResult } from 'server/typings/result.typings';
import { User } from 'server/typings/user.typings';
import { Game } from 'shared/typings/models/game';
import { AssignmentStrategy } from 'server/typings/config.typings';
import { findUsers } from 'server/db/user/userService';
import { findGames } from 'server/db/game/gameService';

export const runAssignment = async (
  startingTime: string,
  assignmentStrategy: AssignmentStrategy = config.assignmentStrategy
): Promise<PlayerAssignmentResult> => {
  try {
    await removeInvalidSignupsFromUsers();
  } catch (error) {
    throw new Error(`Error removing invalid games: ${error}`);
  }

  let users: readonly User[] = [];
  try {
    users = await findUsers();
  } catch (error) {
    throw new Error(`findUsers error: ${error}`);
  }

  let games: readonly Game[] = [];
  try {
    games = await findGames();
  } catch (error) {
    logger.error(`findGames error: ${error}`);
    throw new Error(`findGames error: ${error}`);
  }

  let assignResults;
  try {
    assignResults = runAssignmentStrategy(
      users,
      games,
      startingTime,
      assignmentStrategy
    );
  } catch (error) {
    throw new Error(`Player assign error: ${error}`);
  }

  return assignResults;
};
