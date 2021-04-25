import 'array-flat-polyfill';
import { logger } from 'server/utils/logger';
import { updateWithSignups } from 'server/features/game-popularity/utils/updateWithSignups';
import { updateWithAssign } from 'server/features/game-popularity/utils/updateWithAssign';
import { config } from 'server/config';
import { User } from 'shared/typings/models/user';
import { Game } from 'shared/typings/models/game';
import { findUsers } from 'server/features/user/userRepository';
import { findGames } from 'server/features/game/gameRepository';

export const updateGamePopularity = async (): Promise<void> => {
  logger.info('Calculate game popularity');
  const { gamePopularityUpdateMethod } = config;

  let users: User[] = [];
  try {
    users = await findUsers();
  } catch (error) {
    logger.error(`findUsers error: ${error}`);
  }

  let games: Game[] = [];
  try {
    games = await findGames();
  } catch (error) {
    logger.error(`findGames error: ${error}`);
  }

  if (gamePopularityUpdateMethod === 'signups')
    await updateWithSignups(users, games);
  else if (gamePopularityUpdateMethod === 'assign')
    await updateWithAssign(users, games);

  logger.info('Game popularity updated');
};
