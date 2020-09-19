import { logger } from 'utils/logger';
import { db } from 'db/mongodb';
import { config } from 'config';
import { runAssignmentStrategy } from 'player-assignment/utils/runAssignmentStrategy';
import { removeInvalidSignupsFromUsers } from 'player-assignment/utils/removeInvalidSignupsFromUsers';
import { PlayerAssignmentResult } from 'typings/result.typings';
import { User } from 'typings/user.typings';
import { Game } from 'typings/game.typings';
import { AssignmentStrategy } from 'typings/config.typings';

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
    users = await db.user.findUsers();
  } catch (error) {
    throw new Error(`findUsers error: ${error}`);
  }

  let games: readonly Game[] = [];
  try {
    games = await db.game.findGames();
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
