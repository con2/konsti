import { findGames } from "server/features/game/gameRepository";
import { UserModel } from "server/features/user/userSchema";
import { logger } from "server/utils/logger";
import { MongoDbError } from "shared/typings/api/errors";
import { Game } from "shared/typings/models/game";
import { NewFavorite, User } from "shared/typings/models/user";
import {
  AsyncResult,
  isErrorResult,
  unwrapResult,
  makeSuccessResult,
  makeErrorResult,
} from "shared/utils/asyncResult";

export const saveFavorite = async (
  favoriteData: NewFavorite
): Promise<AsyncResult<readonly Game[] | null, MongoDbError>> => {
  const { username, favoritedGameIds } = favoriteData;

  const gamesAsyncResult = await findGames();

  if (isErrorResult(gamesAsyncResult)) {
    return gamesAsyncResult;
  }

  const games = unwrapResult(gamesAsyncResult);

  const favoritedGames = favoritedGameIds.reduce<string[]>(
    (acc, favoritedGameId) => {
      const gameDocInDb = games.find((game) => game.gameId === favoritedGameId);

      if (gameDocInDb) {
        acc.push(gameDocInDb._id as string);
      }
      return acc;
    },
    []
  );

  try {
    const response = await UserModel.findOneAndUpdate(
      { username },
      {
        favoritedGames,
      },
      { new: true, fields: "favoritedGames" }
    )
      .lean<User>()
      .populate("favoritedGames", "-_id -__v -updatedAt -createdAt");
    logger.info(
      `MongoDB: Favorite data stored for user "${favoriteData.username}"`
    );
    if (!response) {
      logger.error(`MongoDB: User not found`);
      return makeErrorResult(MongoDbError.USER_NOT_FOUND);
    }
    return makeSuccessResult(response.favoritedGames);
  } catch (error) {
    logger.error(
      `MongoDB: Error storing favorite data for user "${favoriteData.username}" - ${error}`
    );
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};
