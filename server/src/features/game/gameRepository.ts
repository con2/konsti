import { logger } from "server/utils/logger";
import { GameModel } from "server/features/game/gameSchema";
import { removeMovedGamesFromUsers } from "server/features/player-assignment/utils/removeMovedGamesFromUsers";
import { GameDoc } from "server/typings/game.typings";
import { Game } from "shared/typings/models/game";
import {
  makeSuccessResult,
  AsyncResult,
  makeErrorResult,
  isErrorResult,
} from "shared/utils/asyncResult";
import { removeDeletedGames } from "server/features/game/gameUtils";
import { removeInvalidGamesFromUsers } from "server/features/player-assignment/utils/removeInvalidGamesFromUsers";
import { MongoDbError } from "shared/typings/api/errors";

export const removeGames = async (
  gameIds?: string[]
): Promise<AsyncResult<void, MongoDbError>> => {
  logger.info(
    `MongoDB: remove games from db: ${gameIds ? gameIds.join(", ") : "ALL"}`
  );

  try {
    await GameModel.deleteMany(gameIds ? { gameId: { $in: gameIds } } : {});
    return makeSuccessResult(undefined);
  } catch (error) {
    logger.error(`MongoDB: Error removing games - ${error}`);
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

export const saveGames = async (
  games: readonly Game[]
): Promise<AsyncResult<Game[], MongoDbError>> => {
  logger.info("MongoDB: Store games to DB");

  const removeDeletedGamesAsyncResult = await removeDeletedGames(games);
  if (isErrorResult(removeDeletedGamesAsyncResult)) {
    return removeDeletedGamesAsyncResult;
  }

  await removeInvalidGamesFromUsers();

  const removeMovedGamesAsyncResult = await removeMovedGamesFromUsers(games);
  if (isErrorResult(removeMovedGamesAsyncResult)) {
    return removeMovedGamesAsyncResult;
  }

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
            shortDescription: game.shortDescription,
            revolvingDoor: game.revolvingDoor,
            programType: game.programType,
            contentWarnings: game.contentWarnings,
            otherAuthor: game.otherAuthor,
            accessibilityValues: game.accessibilityValues,
            otherInaccessibility: game.otherInaccessibility,
            entryFee: game.entryFee,
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
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }

  logger.debug("MongoDB: Games saved to DB successfully");
  return await findGames();
};

export const findGames = async (): Promise<
  AsyncResult<GameDoc[], MongoDbError>
> => {
  try {
    const response = await GameModel.find({});
    logger.debug(`MongoDB: Find all games`);
    return makeSuccessResult(response);
  } catch (error) {
    logger.error(`MongoDB: Error fetching games - ${error}`);
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

export const findGameById = async (
  gameId: string
): Promise<AsyncResult<GameDoc, MongoDbError>> => {
  logger.debug(`MongoDB: Find game with id ${gameId}`);

  try {
    const response = await GameModel.findOne({ gameId });
    if (!response) {
      return makeErrorResult(MongoDbError.GAME_NOT_FOUND);
    }
    return makeSuccessResult(response);
  } catch (error) {
    logger.error(`MongoDB: Error fetching gameId ${gameId} - ${error}`);
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

export const saveGamePopularity = async (
  gameId: string,
  popularity: number
): Promise<AsyncResult<void, MongoDbError>> => {
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
    return makeSuccessResult(undefined);
  } catch (error) {
    logger.error(`Error updating game popularity: ${error}`);
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};
