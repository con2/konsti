import _ from 'lodash';
import { findGames } from 'server/features/game/gameRepository';
import { GameModel } from 'server/features/game/gameSchema';
import { removeInvalidSignupsFromUsers } from 'server/features/player-assignment/utils/removeInvalidSignupsFromUsers';
import { GameDoc } from 'server/typings/game.typings';
import { logger } from 'server/utils/logger';
import { Game } from 'shared/typings/models/game';
import { NumPlayersInGame } from 'shared/typings/api/games';
import { findUsers } from 'server/features//user/userRepository';
import { User } from 'shared/typings/models/user';

export const removeDeletedGames = async (
  updatedGames: readonly Game[]
): Promise<void> => {
  const currentGames = await findGames();

  const deletedGames = _.differenceBy(currentGames, updatedGames, 'gameId');

  if (deletedGames && deletedGames.length !== 0) {
    logger.info(`Found ${deletedGames.length} deleted games, remove...`);

    try {
      await Promise.all(
        deletedGames.map(async (deletedGame) => {
          await GameModel.deleteOne({ gameId: deletedGame.gameId });
        })
      );
    } catch (error) {
      logger.error(`Error removing deleted games: ${error}`);
      return await Promise.reject(error);
    }

    await removeInvalidSignupsFromUsers();
  }
};

export const getGameById = async (gameId: string): Promise<GameDoc> => {
  let games: GameDoc[];
  try {
    games = await findGames();
  } catch (error) {
    logger.error(`MongoDB: Error loading games - ${error}`);
    return error;
  }

  const foundGame = games.find((game) => game.gameId === gameId);

  if (!foundGame) throw new Error(`Game ${gameId} not found`);

  return foundGame;
};

export const getNumPlayersInGames = async (
  games: readonly Game[]
): Promise<NumPlayersInGame[]> => {
  const numPlayers: NumPlayersInGame[] = [];
  try {
    const users = await findUsers();
    for (const game of games) {
      numPlayers.push({
        gameId: game.gameId,
        numPlayers: countNumPlayers(users, game.gameId),
      });
    }
  } catch (error) {
    logger.error(
      `getNumPlayersInGames: Error calculating number of players in games - ${error}`
    );
    return error;
  }
  return numPlayers;
};

const countNumPlayers = (users: User[], gameId: string): number => {
  return users.filter(
    (user) =>
      user.enteredGames.filter(
        (enteredGame) => enteredGame.gameDetails.gameId === gameId
      ).length > 0
  ).length;
};
