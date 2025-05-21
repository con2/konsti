import { z } from "zod";
import { UserModel, UserSchemaDb } from "server/features/user/userSchema";
import { convertDatesToStrings } from "server/utils/convertDatesToStrings";
import { logger } from "server/utils/logger";
import { MongoDbError } from "shared/types/api/errors";
import { User } from "shared/types/models/user";
import {
  Result,
  makeErrorResult,
  makeSuccessResult,
} from "shared/utils/result";

export const findGroupMembers = async (
  groupCode: string,
): Promise<Result<User[], MongoDbError>> => {
  try {
    const response = await UserModel.find({ groupCode }).lean();
    if (response.length === 0) {
      logger.info(`MongoDB: group ${groupCode} not found`);
    } else {
      logger.debug(
        `MongoDB: Found group ${groupCode} with ${response.length} members`,
      );
    }

    const result = z.array(UserSchemaDb).safeParse(response);
    if (!result.success) {
      logger.error(
        "%s",
        new Error(
          `Error validating findGroupMembers DB value: ${JSON.stringify(result.error)}`,
        ),
      );
      return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
    }

    return makeSuccessResult(convertDatesToStrings(result.data));
  } catch (error) {
    logger.error(`MongoDB: Error finding group ${groupCode}: %s`, error);
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

export const checkGroupExists = async (
  groupCode: string,
): Promise<Result<boolean, MongoDbError>> => {
  try {
    const response = await UserModel.exists({ groupCreatorCode: groupCode });
    return makeSuccessResult(!!response);
  } catch (error) {
    logger.error(
      `MongoDB: Error checking if group ${groupCode} exists: %s`,
      error,
    );
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

export const saveGroupCreatorCode = async (
  groupCreatorCode: string,
  username: string,
): Promise<Result<User, MongoDbError>> => {
  try {
    const response = await UserModel.findOneAndUpdate(
      { username },
      { groupCode: groupCreatorCode, groupCreatorCode },
      { new: true },
    ).lean();

    if (!response) {
      logger.info(`MongoDB: saveGroupCreatorCode user ${username} not found`);
      return makeErrorResult(MongoDbError.USER_NOT_FOUND);
    }

    logger.info(
      `MongoDB: Saved group creator code ${groupCreatorCode} for user ${username}`,
    );

    const result = UserSchemaDb.safeParse(response);
    if (!result.success) {
      logger.error(
        "%s",
        new Error(
          `Error validating saveGroupCreatorCode DB value: ${JSON.stringify(result.error)}`,
        ),
      );
      return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
    }
    return makeSuccessResult(convertDatesToStrings(result.data));
  } catch {
    logger.error(
      `MongoDB: Error saving group creator code ${groupCreatorCode} for user ${username}`,
    );
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

export const saveGroupCode = async (
  groupCode: string,
  username: string,
): Promise<Result<User, MongoDbError>> => {
  try {
    const response = await UserModel.findOneAndUpdate(
      { username },
      { groupCode },
      { new: true },
    ).lean();

    if (!response) {
      logger.info(`MongoDB: saveGroupCode user ${username} not found`);
      return makeErrorResult(MongoDbError.USER_NOT_FOUND);
    }

    if (groupCode === "0") {
      logger.info(`MongoDB: User ${username} left group`);
    } else {
      logger.info(`MongoDB: Group ${groupCode} stored for user ${username}`);
    }
    const result = UserSchemaDb.safeParse(response);
    if (!result.success) {
      logger.error(
        "%s",
        new Error(
          `Error validating saveGroupCode DB value: ${JSON.stringify(result.error)}`,
        ),
      );
      return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
    }
    return makeSuccessResult(convertDatesToStrings(result.data));
  } catch (error) {
    logger.error(
      `MongoDB: Error storing group ${groupCode} stored for user ${username}: %s`,
      error,
    );
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};
