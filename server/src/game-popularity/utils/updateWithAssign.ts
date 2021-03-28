import moment from 'moment';
import _ from 'lodash';
import { logger } from 'server/utils/logger';
import { padgAssignPlayers } from 'server/player-assignment/padg/padgAssignPlayers';
import { User } from 'server/typings/user.typings';
import { Game } from 'shared/typings/models/game';
import { Result } from 'server/typings/result.typings';
import { saveGamePopularity } from 'server/db/game/gameService';

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
          await saveGamePopularity(game.gameId, groupedSignups[game.gameId]);
        }
      })
    );
  } catch (error) {
    logger.error(`saveGamePopularity error: ${error}`);
    throw new Error('Update game popularity error');
  }
};
