import { UserModel } from "server/features/user/userSchema";
import { logger } from "server/utils/logger";
import { MongoDbError } from "shared/typings/api/errors";
import { User } from "shared/typings/models/user";
import {
  Result,
  makeErrorResult,
  makeSuccessResult,
} from "shared/utils/result";

export const findGroupMembers = async (
  groupCode: string,
): Promise<Result<User[], MongoDbError>> => {
  try {
    const response = await UserModel.find({ groupCode })
      .lean<User[]>()
      .populate("favoritedGames")
      .populate("signedGames.gameDetails");
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!response || response.length === 0) {
      logger.info(`MongoDB: group ${groupCode} not found`);
    } else {
      logger.debug(
        `MongoDB: Found group ${groupCode} with ${response.length} members`,
      );
    }
    return makeSuccessResult(response);
  } catch (error) {
    logger.error(`MongoDB: Error finding group ${groupCode}: %s`, error);
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

export const findGroup = async (
  groupCode: string,
  username: string,
): Promise<Result<User | null, MongoDbError>> => {
  if (username) {
    try {
      const response = await UserModel.findOne({
        groupCode,
        username,
      }).lean<User>();
      if (!response) {
        logger.info(
          `MongoDB: Group ${groupCode} with creator ${username} not found`,
        );
        return makeSuccessResult(null);
      }
      logger.info(`MongoDB: Group ${groupCode} with creator ${username} found`);
      return makeSuccessResult(response);
    } catch (error) {
      logger.error(`MongoDB: Error finding group ${groupCode}: %s`, error);
      return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
    }
  }

  try {
    const response = await UserModel.findOne({ groupCode }).lean<User>();
    if (!response) {
      logger.info(`MongoDB: Group ${groupCode} not found`);
      return makeSuccessResult(null);
    }
    logger.info(`MongoDB: Group ${groupCode} found`);
    return makeSuccessResult(response);
  } catch (error) {
    logger.error(`MongoDB: Error finding group ${groupCode}: %s`, error);
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

export const saveGroupCode = async (
  groupCode: string,
  username: string,
): Promise<Result<User | null, MongoDbError>> => {
  try {
    const response = await UserModel.findOneAndUpdate(
      { username },
      { groupCode },
      { new: true, fields: "groupCode" },
    ).lean<User>();
    if (groupCode === "0") {
      logger.info(`MongoDB: User ${username} left group`);
    } else {
      logger.info(`MongoDB: Group ${groupCode} stored for user ${username}`);
    }
    return makeSuccessResult(response);
  } catch (error) {
    logger.error(
      `MongoDB: Error storing group ${groupCode} stored for user ${username}: %s`,
      error,
    );
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};
