import _ from 'lodash';
import { logger } from 'utils/logger';
import { db } from 'db/mongodb';
import { User } from 'typings/user.typings';
import { Game } from 'typings/game.typings';

export const updateWithSignups = async (
  users: User[],
  games: Game[]
): Promise<void> => {
  const groupLeaders = users.filter(
    (user) => user.groupCode !== '0' && user.groupCode === user.serial
  );

  const allUsers = users.map((user) => {
    const groupLeader = groupLeaders.find(
      (groupLeader) =>
        user.groupCode === groupLeader.groupCode &&
        user.serial !== groupLeader.serial
    );

    if (groupLeader) {
      return { ...user, signedGames: groupLeader.signedGames };
    } else return user;
  });

  const signedGames = allUsers.flatMap((user) =>
    user.signedGames.map((signedGames) => signedGames.gameDetails)
  );

  const groupedSignups = _.countBy(signedGames, 'gameId');

  try {
    await Promise.all(
      games.map(async (game) => {
        if (groupedSignups[game.gameId]) {
          await db.game.saveGamePopularity(
            game.gameId,
            groupedSignups[game.gameId]
          );
        }
      })
    );
  } catch (error) {
    logger.error(`saveGamePopularity error: ${error}`);
    throw new Error('Update game popularity error');
  }
};
