import { UserModel } from "server/features/user/userSchema";
import { logger } from "server/utils/logger";
import { MongoDbError } from "shared/types/api/errors";
import {
  FavoriteProgramItemId,
  NewFavorite,
  User,
} from "shared/types/models/user";
import {
  Result,
  makeSuccessResult,
  makeErrorResult,
} from "shared/utils/result";

export const saveFavorite = async (
  newFavorite: NewFavorite,
): Promise<Result<readonly FavoriteProgramItemId[] | null, MongoDbError>> => {
  const { username, favoriteProgramItemIds } = newFavorite;

  try {
    const response = await UserModel.findOneAndUpdate(
      { username },
      {
        favoriteProgramItemIds,
      },
      { new: true, fields: "favoriteProgramItemIds" },
    ).lean<User>();
    logger.info(
      `MongoDB: Favorite data stored for user ${newFavorite.username}`,
    );
    if (!response) {
      logger.error("%s", new Error(`MongoDB: User ${username} not found`));
      return makeErrorResult(MongoDbError.USER_NOT_FOUND);
    }
    return makeSuccessResult(response.favoriteProgramItemIds);
  } catch (error) {
    logger.error(
      `MongoDB: Error storing favorite data for user ${newFavorite.username}: %s`,
      error,
    );
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};
