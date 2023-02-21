import { logger } from "server/utils/logger";
import { GameModel } from "server/features/game/gameSchema";
import { removeMovedGamesFromUsers } from "server/features/player-assignment/utils/removeMovedGamesFromUsers";
import { GameDoc } from "server/typings/game.typings";
import { Game } from "shared/typings/models/game";
import { removeDeletedGames } from "server/features/game/gameUtils";
import { removeInvalidGamesFromUsers } from "server/features/player-assignment/utils/removeInvalidGamesFromUsers";

export const removeGames = async (gameIds?: string[]): Promise<void> => {
  logger.info(
    `MongoDB: remove games from db: ${gameIds ? gameIds.join(", ") : "ALL"}`
  );

  try {
    await GameModel.deleteMany(gameIds ? { gameId: { $in: gameIds } } : {});
  } catch (error) {
    throw new Error(`MongoDB: Error removing games - ${error}`);
  }
};

export const saveGames = async (games: readonly Game[]): Promise<Game[]> => {
  logger.info("MongoDB: Store games to DB");

  await removeDeletedGames(games);
  await removeInvalidGamesFromUsers();
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
    throw error;
  }

  logger.debug("MongoDB: Games saved to DB successfully");
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
    throw error;
  }
};

export const findGameById = async (gameId: string): Promise<GameDoc> => {
  logger.debug(`MongoDB: Find game with id ${gameId}`);

  let response;
  try {
    response = await GameModel.findOne({ gameId });
    if (!response) throw new Error(`Game ${gameId} not found`);
  } catch (error) {
    logger.error(`MongoDB: Error fetching gameId ${gameId} - ${error}`);
    throw error;
  }

  return response;
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
