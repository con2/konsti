import { ObjectId } from "mongoose";
import { logger } from "server/utils/logger";
import { GameModel } from "server/features/game/gameSchema";
import { updateMovedGames } from "server/features/player-assignment/utils/updateMovedGames";
import { GameDoc } from "server/typings/game.typings";
import { Game } from "shared/typings/models/game";
import {
  makeSuccessResult,
  Result,
  makeErrorResult,
  isErrorResult,
} from "shared/utils/result";
import { removeDeletedGames } from "server/features/game/gameUtils";
import { removeInvalidGamesFromUsers } from "server/features/player-assignment/utils/removeInvalidGamesFromUsers";
import { MongoDbError } from "shared/typings/api/errors";
import { createEmptySignupDocumentForProgramItems } from "server/features/signup/signupRepository";

export const removeGames = async (
  gameIds?: string[],
): Promise<Result<void, MongoDbError>> => {
  logger.info(
    `MongoDB: remove games from db: ${gameIds ? gameIds.join(", ") : "ALL"}`,
  );

  try {
    await GameModel.deleteMany(gameIds ? { gameId: { $in: gameIds } } : {});
    return makeSuccessResult(undefined);
  } catch (error) {
    logger.error("MongoDB: Error removing games: %s", error);
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

export const saveGames = async (
  games: readonly Game[],
): Promise<Result<void, MongoDbError>> => {
  logger.info("MongoDB: Store games to DB");

  // This will remove direct signups and games
  const removeDeletedGamesResult = await removeDeletedGames(games);
  if (isErrorResult(removeDeletedGamesResult)) {
    return removeDeletedGamesResult;
  }

  // If games were deleted, this will remove lottery signups and favorited games
  const removeInvalidGamesResult = await removeInvalidGamesFromUsers();
  if (isErrorResult(removeInvalidGamesResult)) {
    return removeInvalidGamesResult;
  }

  const updateMovedGamesResult = await updateMovedGames(games);
  if (isErrorResult(updateMovedGamesResult)) {
    return updateMovedGamesResult;
  }

  const bulkOps = games.map((game) => {
    const newGame: Omit<Game, "popularity"> = {
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
      otherAccessibilityInformation: game.otherAccessibilityInformation,
      entryFee: game.entryFee,
      signupType: game.signupType,
    };

    return {
      updateOne: {
        filter: {
          gameId: game.gameId,
        },
        update: {
          ...newGame,
        },
        upsert: true,
      },
    };
  });

  let response;
  try {
    response = await GameModel.bulkWrite(bulkOps);
    logger.debug("MongoDB: Games saved to DB successfully");
  } catch (error) {
    logger.error("Error saving games to DB: %s", error);
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }

  const newGameObjectIds: ObjectId[] = Object.values(response.upsertedIds);
  logger.info(`MongoDB: Found ${newGameObjectIds.length} new program items`);

  // Create signup document for new program items
  if (newGameObjectIds.length > 0) {
    const createEmptySignupResult =
      await createEmptySignupDocumentForProgramItems(newGameObjectIds);
    if (isErrorResult(createEmptySignupResult)) {
      return createEmptySignupResult;
    }
  }

  return makeSuccessResult(undefined);
};

export const findGames = async (): Promise<Result<GameDoc[], MongoDbError>> => {
  try {
    const response = await GameModel.find({});
    logger.debug(`MongoDB: Find all games`);
    return makeSuccessResult(response);
  } catch (error) {
    logger.error("MongoDB: Error fetching games: %s", error);
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

export const findGameById = async (
  gameId: string,
): Promise<Result<GameDoc, MongoDbError>> => {
  logger.debug(`MongoDB: Find game with id ${gameId}`);

  try {
    const response = await GameModel.findOne({ gameId });
    if (!response) {
      return makeErrorResult(MongoDbError.GAME_NOT_FOUND);
    }
    return makeSuccessResult(response);
  } catch (error) {
    logger.error("MongoDB: Error fetching gameId: %s", error);
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

interface PopularityUpdate {
  gameId: string;
  popularity: number;
}

export const saveGamePopularity = async (
  popularityUpdates: PopularityUpdate[],
): Promise<Result<void, MongoDbError>> => {
  const bulkOps = popularityUpdates.map((popularityUpdate) => {
    return {
      updateOne: {
        filter: {
          gameId: popularityUpdate.gameId,
        },
        update: {
          popularity: popularityUpdate.popularity,
        },
      },
    };
  });

  try {
    await GameModel.bulkWrite(bulkOps);
    logger.info(
      `MongoDB: Updated popularity for ${popularityUpdates.length} games`,
    );
    return makeSuccessResult(undefined);
  } catch (error) {
    logger.error("Error updating game popularity: %s", error);
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};
