import { MongoDbError } from "shared/typings/api/errors";
import {
  Result,
  makeErrorResult,
  makeSuccessResult,
} from "shared/utils/result";
import {
  PostActionLogIsSeenRequest,
  PostActionLogItemRequest,
} from "shared/typings/api/actionLog";
import { UserModel } from "server/features/user/userSchema";
import { logger } from "server/utils/logger";
import { ActionLogItem } from "shared/typings/models/actionLog";

export const addToActionLogs = async (
  actionLogRequest: PostActionLogItemRequest
): Promise<Result<void, MongoDbError>> => {
  const { updates, action } = actionLogRequest;

  const usernames = updates.map((update) => update.username);
  try {
    await UserModel.updateMany(
      {
        username: { $in: usernames },
      },
      {
        $addToSet: {
          actionLogItems: {
            action,
            eventItemId: "123",
            isSeen: false,
          },
        },
      }
    );
    logger.info(`MongoDB: Action log item added for users ${usernames}`);
    return makeSuccessResult(undefined);
  } catch (error) {
    logger.error(
      `MongoDB: Error adding action log item for users ${usernames}: %s`,
      error
    );
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

export const updateActionLogItem = async (
  request: PostActionLogIsSeenRequest
): Promise<Result<ActionLogItem[] | null, MongoDbError>> => {
  const { username, actionLogItemId, isSeen } = request;
  try {
    const response = await UserModel.findOneAndUpdate(
      { username, "actionLogItems._id": actionLogItemId },
      {
        $set: { "actionLogItems.$[logItem].isSeen": isSeen },
      },
      {
        arrayFilters: [{ "logItem._id": actionLogItemId }],
        new: true,
      }
    );
    if (response) {
      return makeSuccessResult(
        response.actionLogItems.map((item) => ({
          // @ts-expect-error: Mongoose return value is missing nested _id
          actionLogItemId: item._id,
          action: item.action,
          isSeen: item.isSeen,
          eventItemId: item.eventItemId,
        }))
      );
    }
    return makeSuccessResult(null);
  } catch (error) {
    logger.error(
      `MongoDB: Error updating action log item for user ${username}: %s`,
      error
    );
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};
