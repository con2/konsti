import { MongoDbError } from "shared/typings/api/errors";
import {
  Result,
  makeErrorResult,
  makeSuccessResult,
} from "shared/utils/result";
import {
  PostEventLogIsSeenRequest,
  PostEventLogItemRequest,
} from "shared/typings/api/eventLog";
import { UserModel } from "server/features/user/userSchema";
import { logger } from "server/utils/logger";
import { EventLogItem } from "shared/typings/models/eventLog";

export const addToEventLogs = async (
  eventLogRequest: PostEventLogItemRequest
): Promise<Result<void, MongoDbError>> => {
  const { updates, action } = eventLogRequest;

  const bulkOps = updates.map((update) => {
    return {
      updateOne: {
        filter: {
          username: update.username,
        },
        update: {
          $addToSet: {
            eventLogItems: {
              action,
              programItemId: update.programItemId,
              isSeen: false,
              createdAt: update.createdAt,
            },
          },
        },
      },
    };
  });

  const usernames = updates.map((update) => update.username);

  try {
    // @ts-expect-error: Types don't work with $addToSet
    await UserModel.bulkWrite(bulkOps);
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

export const updateEventLogItem = async (
  request: PostEventLogIsSeenRequest
): Promise<Result<EventLogItem[] | null, MongoDbError>> => {
  const { username, eventLogItemId, isSeen } = request;
  try {
    const response = await UserModel.findOneAndUpdate(
      { username, "eventLogItems._id": eventLogItemId },
      {
        $set: { "eventLogItems.$[logItem].isSeen": isSeen },
      },
      {
        arrayFilters: [{ "logItem._id": eventLogItemId }],
        new: true,
      }
    );
    if (response) {
      return makeSuccessResult(
        response.eventLogItems.map((item) => ({
          // @ts-expect-error: Mongoose return value is missing nested _id
          eventLogItemId: item._id,
          action: item.action,
          isSeen: item.isSeen,
          programItemId: item.programItemId,
          createdAt: item.createdAt,
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
