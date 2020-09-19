import moment from 'moment';
import _ from 'lodash';
import { db } from 'db/mongodb';
import { logger } from 'utils/logger';
import { padgAssignPlayers } from 'player-assignment/padg/padgAssignPlayers';
import { User } from 'typings/user.typings';
import { Game } from 'typings/game.typings';
import { Result } from 'typings/result.typings';

export const updateWithAssign = async (
  users: readonly User[],
  games: readonly Game[]
): Promise<void> => {
  const groupedGames = _.groupBy(games, (game) =>
    moment(game.startTime).utc().format()
  );

  let results = [] as readonly Result[];
  _.forEach(groupedGames, (value, key) => {
    const assignmentResult = padgAssignPlayers(users, games, key);
    results = results.concat(assignmentResult.results);
  });

  const signedGames = results.flatMap(
    (result) => result.enteredGame.gameDetails
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
