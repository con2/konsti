import { AnyBulkWriteOperation } from "mongoose";
import { unique } from "remeda";
import { MongoDbError } from "shared/types/api/errors";
import {
  Result,
  makeErrorResult,
  makeSuccessResult,
} from "shared/utils/result";
import {
  PostEventLogIsSeenRequest,
  NewEventLogItem,
} from "shared/types/api/eventLog";
import { UserModel, UserSchemaDb } from "server/features/user/userSchema";
import { logger } from "server/utils/logger";
import { EventLogAction, EventLogItem } from "shared/types/models/eventLog";

export const addEventLogItems = async (
  newEventLogItems: NewEventLogItem[],
): Promise<Result<void, MongoDbError>> => {
  const bulkOps: AnyBulkWriteOperation[] = newEventLogItems.map(
    (newEventLogItem) => {
      return {
        updateOne: {
          filter: {
            username: newEventLogItem.username,
          },
          update: {
            $addToSet: {
              eventLogItems: {
                action: newEventLogItem.action,
                programItemId: newEventLogItem.programItemId,
                programItemStartTime: new Date(
                  newEventLogItem.programItemStartTime,
                ),
                isSeen: false,
                createdAt: new Date(newEventLogItem.createdAt),
              },
            },
          },
        },
      };
    },
  );

  const usernames = unique(
    newEventLogItems.map((newEventLogItem) => newEventLogItem.username),
  );
  const actions = unique(
    newEventLogItems.map((newEventLogItem) => newEventLogItem.action),
  );

  try {
    await UserModel.bulkWrite(bulkOps);
    logger.info(
      `MongoDB: Added ${newEventLogItems.length} event log items (${String(actions)}) for ${usernames.length} users: ${String(usernames)}`,
    );
    return makeSuccessResult();
  } catch (error) {
    logger.error(
      `MongoDB: Error adding ${newEventLogItems.length} event log items (${String(actions)}) for ${usernames.length} users ${String(usernames)}: %s`,
      error,
    );
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

export const updateEventLogItemIsSeen = async (
  request: PostEventLogIsSeenRequest,
  username: string,
): Promise<Result<EventLogItem[], MongoDbError>> => {
  const { eventLogItemId, isSeen } = request;
  try {
    const response = await UserModel.findOneAndUpdate(
      { username, "eventLogItems._id": eventLogItemId },
      {
        $set: { "eventLogItems.$[logItem].isSeen": isSeen },
      },
      {
        arrayFilters: [{ "logItem._id": eventLogItemId }],
        returnDocument: "after",
      },
    ).lean();

    if (!response) {
      logger.info(
        `MongoDB: updateEventLogItemIsSeen user ${username} not found`,
      );
      return makeErrorResult(MongoDbError.USER_OR_LOG_ITEM_NOT_FOUND);
    }

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

    return makeSuccessResult(result.data.eventLogItems);
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
