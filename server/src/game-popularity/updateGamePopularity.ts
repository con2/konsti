import 'array-flat-polyfill';
import { logger } from 'utils/logger';
import { db } from 'db/mongodb';
import { updateWithSignups } from 'game-popularity/utils/updateWithSignups';
import { updateWithAssign } from 'game-popularity/utils/updateWithAssign';
import { config } from 'config';
import { User } from 'typings/user.typings';
import { Game } from 'typings/game.typings';

export const updateGamePopularity = async (): Promise<void> => {
  logger.info('Calculate game popularity');
  const { gamePopularityUpdateMethod } = config;

  let users: User[] = [];
  try {
    users = await db.user.findUsers();
  } catch (error) {
    logger.error(`db.user.findUsers error: ${error}`);
  }

  let games: Game[] = [];
  try {
    games = await db.game.findGames();
  } catch (error) {
    logger.error(`db.user.findGames error: ${error}`);
  }

  if (gamePopularityUpdateMethod === 'signups')
    await updateWithSignups(users, games);
  else if (gamePopularityUpdateMethod === 'assign')
    await updateWithAssign(users, games);

  logger.info('Game popularity updated');
};
