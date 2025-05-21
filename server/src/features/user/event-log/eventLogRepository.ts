import { unique } from "remeda";
import { MongoDbError } from "shared/types/api/errors";
import {
  Result,
  makeErrorResult,
  makeSuccessResult,
} from "shared/utils/result";
import {
  PostEventLogIsSeenRequest,
  NewEventLogItems,
} from "shared/types/api/eventLog";
import { UserModel, UserSchemaDb } from "server/features/user/userSchema";
import { logger } from "server/utils/logger";
import { EventLogAction, EventLogItem } from "shared/types/models/eventLog";
import { convertDatesToStrings } from "server/utils/convertDatesToStrings";

export const addEventLogItems = async (
  eventLogRequest: NewEventLogItems,
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
      `MongoDB: Action log item ${action} added for ${unique(usernames).length} users: ${String(unique(usernames))}`,
    );
    return makeSuccessResult();
  } catch (error) {
    logger.error(
      `MongoDB: Error adding event log item ${action} for ${unique(usernames).length} users ${String(unique(usernames))}: %s`,
      error,
    );
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

export const updateEventLogItemIsSeen = async (
  request: PostEventLogIsSeenRequest,
  username: string,
): Promise<Result<EventLogItem[] | null, MongoDbError>> => {
  const { eventLogItemId, isSeen } = request;
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
    ).lean();

    if (response) {
      const result = UserSchemaDb.safeParse(response);
      if (!result.success) {
        logger.error(
          "%s",
          new Error(
            `Error validating updateEventLogItemIsSeen DB value: ${JSON.stringify(result.error)}`,
          ),
        );
        return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
      }

      return makeSuccessResult(
        convertDatesToStrings(result.data).eventLogItems.map((item) => item),
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
