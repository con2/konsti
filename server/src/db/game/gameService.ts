import _ from 'lodash';
import { logger } from 'server/utils/logger';
import { GameModel } from 'server/db/game/gameSchema';
import { removeInvalidSignupsFromUsers } from 'server/player-assignment/utils/removeInvalidSignupsFromUsers';
import { removeMovedGamesFromUsers } from 'server/player-assignment/utils/removeMovedGamesFromUsers';
import { GameDoc } from 'server/typings/game.typings';
import { Game } from 'shared/typings/models/game';

export const removeGames = async (): Promise<void> => {
  logger.info('MongoDB: remove ALL games from db');
  try {
    await GameModel.deleteMany({});
  } catch (error) {
    throw new Error(`MongoDB: Error removing games - ${error}`);
  }
};

const removeDeletedGames = async (
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

export const saveGames = async (games: readonly Game[]): Promise<Game[]> => {
  logger.info('MongoDB: Store games to DB');

  await removeDeletedGames(games);
  await removeMovedGamesFromUsers(games);

  try {
    await Promise.all(
      games.map(async (game) => {
        await GameModel.updateOne(
          { gameId: game.gameId },
          {
            gameId: game.gameId,
            title: game.title,
            description: game.description,
            location: game.location,
            startTime: game.startTime,
            mins: game.mins,
            tags: game.tags,
            genres: game.genres,
            styles: game.styles,
            language: game.language,
            endTime: game.endTime,
            people: game.people,
            minAttendance: game.minAttendance,
            maxAttendance: game.maxAttendance,
            gameSystem: game.gameSystem,
            englishOk: game.englishOk,
            childrenFriendly: game.childrenFriendly,
            ageRestricted: game.ageRestricted,
            beginnerFriendly: game.beginnerFriendly,
            intendedForExperiencedParticipants:
              game.intendedForExperiencedParticipants,
            shortDescription: game.shortDescription,
            revolvingDoor: game.revolvingDoor,
            programType: game.programType,
          },
          {
            upsert: true,
            setDefaultsOnInsert: true,
          }
        );
      })
    );
  } catch (error) {
    logger.error(`Error saving games to db: ${error}`);
    return await Promise.reject(error);
  }

  logger.debug('MongoDB: Games saved to DB successfully');
  return await findGames();
};

export const findGames = async (): Promise<GameDoc[]> => {
  let response;
  try {
    response = await GameModel.find({});
    logger.debug(`MongoDB: Find all games`);
    return response;
  } catch (error) {
    logger.error(`MongoDB: Error fetching games - ${error}`);
    return error;
  }
};

export const saveGamePopularity = async (
  gameId: string,
  popularity: number
): Promise<void> => {
  logger.debug(`MongoDB: Update game ${gameId} popularity to ${popularity}`);
  try {
    await GameModel.updateOne(
      {
        gameId,
      },
      {
        popularity,
      }
    );
  } catch (error) {
    logger.error(`Error updating game popularity: ${error}`);
  }
};
