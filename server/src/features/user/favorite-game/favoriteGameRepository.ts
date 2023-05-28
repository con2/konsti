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

  let response;
  try {
    response = await UserModel.findOneAndUpdate(
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
      throw new Error(`User not found`);
    }
  } catch (error) {
    logger.error(
      `MongoDB: Error storing favorite data for user "${favoriteData.username}" - ${error}`
    );
    throw error;
  }

  return makeSuccessResult(response.favoritedGames);
};
