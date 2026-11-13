import { MongoDbError } from "shared/types/api/errors";
import { FavoriteProgramItemId, NewFavorite } from "shared/types/models/user";
import {
  Result,
  makeErrorResult,
  makeSuccessResult,
} from "shared/utils/result";
import { UserModel, UserSchemaDb } from "server/features/user/userSchema";
import { logger } from "server/utils/logger";

export const saveFavorite = async (
  newFavorite: NewFavorite,
): Promise<Result<readonly FavoriteProgramItemId[], MongoDbError>> => {
  const { userId, favoriteProgramItemIds } = newFavorite;

  try {
    const response = await UserModel.findOneAndUpdate(
      { userId },
      {
        favoriteProgramItemIds,
      },
      { returnDocument: "after" },
    ).lean();

    if (!response) {
      logger.error(new Error(`MongoDB: User ${userId} not found`));
      return makeErrorResult(MongoDbError.USER_NOT_FOUND);
    }

    logger.info(`MongoDB: Favorite data stored for user ${newFavorite.userId}`);

    const result = UserSchemaDb.safeParse(response);
    if (!result.success) {
      logger.error(
        new Error(`Error validating saveFavorite DB value`, {
          cause: result.error,
        }),
      );
      return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
    }

    return makeSuccessResult(result.data.favoriteProgramItemIds);
  } catch (error) {
    logger.error(
      new Error(
        `MongoDB: Error storing favorite data for user ${newFavorite.userId}`,
        { cause: error },
      ),
    );
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};
