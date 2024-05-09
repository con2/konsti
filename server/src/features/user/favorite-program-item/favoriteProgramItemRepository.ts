import { findProgramItems } from "server/features/program-item/programItemRepository";
import { UserModel } from "server/features/user/userSchema";
import { logger } from "server/utils/logger";
import { MongoDbError } from "shared/types/api/errors";
import { ProgramItem } from "shared/types/models/programItem";
import { NewFavorite, User } from "shared/types/models/user";
import {
  Result,
  isErrorResult,
  unwrapResult,
  makeSuccessResult,
  makeErrorResult,
} from "shared/utils/result";

export const saveFavorite = async (
  favoriteData: NewFavorite,
): Promise<Result<readonly ProgramItem[] | null, MongoDbError>> => {
  const { username, favoritedProgramItemIds } = favoriteData;

  const programItemsResult = await findProgramItems();

  if (isErrorResult(programItemsResult)) {
    return programItemsResult;
  }

  const programItems = unwrapResult(programItemsResult);

  const favoritedProgramItems = favoritedProgramItemIds.reduce<string[]>(
    (acc, favoritedProgramItemId) => {
      const programItemDocInDb = programItems.find(
        (programItem) => programItem.programItemId === favoritedProgramItemId,
      );

      if (programItemDocInDb) {
        acc.push(programItemDocInDb._id as string);
      }
      return acc;
    },
    [],
  );

  try {
    const response = await UserModel.findOneAndUpdate(
      { username },
      {
        favoritedProgramItems,
      },
      { new: true, fields: "favoritedGames" },
    )
      .lean<User>()
      .populate("favoritedGames", "-_id -__v -updatedAt -createdAt");
    logger.info(
      `MongoDB: Favorite data stored for user ${favoriteData.username}`,
    );
    if (!response) {
      logger.error("%s", new Error(`MongoDB: User ${username} not found`));
      return makeErrorResult(MongoDbError.USER_NOT_FOUND);
    }
    return makeSuccessResult(response.favoritedProgramItems);
  } catch (error) {
    logger.error(
      `MongoDB: Error storing favorite data for user ${favoriteData.username}: %s`,
      error,
    );
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};
