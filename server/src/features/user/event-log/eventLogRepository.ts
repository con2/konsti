import dayjs from "dayjs";
import { uniq } from "lodash-es";
import { MongoDbError } from "shared/types/api/errors";
import {
  Result,
  makeErrorResult,
  makeSuccessResult,
} from "shared/utils/result";
import {
  PostEventLogIsSeenRequest,
  PostEventLogItemRequest,
} from "shared/types/api/eventLog";
import { UserModel } from "server/features/user/userSchema";
import { logger } from "server/utils/logger";
import { EventLogAction, EventLogItem } from "shared/types/models/eventLog";

export const addEventLogItems = async (
  eventLogRequest: PostEventLogItemRequest,
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
              programItemStartTime: update.programItemStartTime,
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
    await UserModel.bulkWrite(bulkOps);
    logger.info(
      `MongoDB: Action log item ${action} added for ${uniq(usernames).length} users: ${uniq(usernames)}`,
    );
    return makeSuccessResult();
  } catch (error) {
    logger.error(
      `MongoDB: Error adding event log item ${action} for ${uniq(usernames).length} users ${uniq(usernames)}: %s`,
      error,
    );
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

export const updateEventLogItemIsSeen = async (
  request: PostEventLogIsSeenRequest,
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
      },
    );
    if (response) {
      return makeSuccessResult(
        response.eventLogItems.map((item) => ({
          // @ts-expect-error: Mongoose return value is missing nested _id
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          eventLogItemId: item._id,
          programItemStartTime: dayjs(item.programItemStartTime).toISOString(),
          action: item.action,
          isSeen: item.isSeen,
          programItemId: item.programItemId,
          createdAt: dayjs(item.createdAt).toISOString(),
        })),
      );
    }
    return makeSuccessResult(null);
  } catch (error) {
    logger.error(
      `MongoDB: Error updating event log item for user ${username}: %s`,
      error,
    );
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

export const deleteEventLogItemsByStartTime = async (
  startTime: string,
  actions: EventLogAction[],
): Promise<Result<void, MongoDbError>> => {
  try {
    await UserModel.updateMany(
      {},
      {
        $pull: {
          eventLogItems: {
            programItemStartTime: startTime,
            action: { $in: actions },
          },
        },
      },
    );
    return makeSuccessResult();
  } catch (error) {
    logger.error(
      `Deleting event log items for startTime ${startTime} failed: %s`,
      error,
    );
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};
