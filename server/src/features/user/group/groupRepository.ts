import { UserModel, UserSchemaDb } from "server/features/user/userSchema";
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

    const results = response.flatMap((user) => {
      const result = UserSchemaDb.safeParse(user);
      if (!result.success) {
        logger.error(
          new Error(
            `Error validating findGroupMembers DB value: username: ${user.username}, ${JSON.stringify(result.error)}`,
          ),
        );
        return [];
      }
      return result.data;
    });

    return makeSuccessResult(results);
  } catch (error) {
    logger.error(
      new Error(`MongoDB: Error finding group ${groupCode}`, { cause: error }),
    );
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

export const checkGroupExists = async (
  groupCode: string,
): Promise<Result<boolean, MongoDbError>> => {
  try {
    const response = await UserModel.exists({
      groupCode,
      isGroupCreator: true,
    });
    return makeSuccessResult(!!response);
  } catch (error) {
    logger.error(
      new Error(`MongoDB: Error checking if group ${groupCode} exists`, {
        cause: error,
      }),
    );
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

export const saveGroupCreator = async (
  groupCode: string,
  isGroupCreator: boolean,
  username: string,
): Promise<Result<User, MongoDbError>> => {
  try {
    const response = await UserModel.findOneAndUpdate(
      { username },
      { groupCode, isGroupCreator },
      { returnDocument: "after" },
    ).lean();

    if (!response) {
      logger.info(`MongoDB: saveGroupCreator user ${username} not found`);
      return makeErrorResult(MongoDbError.USER_NOT_FOUND);
    }

    logger.info(
      `MongoDB: Saved group creator status ${isGroupCreator} for user ${username} with groupCode ${groupCode}`,
    );

    const result = UserSchemaDb.safeParse(response);
    if (!result.success) {
      logger.error(
        new Error(
          `Error validating saveGroupCreator DB value: ${JSON.stringify(result.error)}`,
        ),
      );
      return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
    }
    return makeSuccessResult(result.data);
  } catch (error) {
    logger.error(
      new Error(
        `MongoDB: Error saving group creator status for user ${username}`,
        { cause: error },
      ),
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
      { returnDocument: "after" },
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
        new Error(
          `Error validating saveGroupCode DB value: ${JSON.stringify(result.error)}`,
        ),
      );
      return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
    }
    return makeSuccessResult(result.data);
  } catch (error) {
    logger.error(
      new Error(
        `MongoDB: Error storing group ${groupCode} for user ${username}`,
        { cause: error },
      ),
    );
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};
