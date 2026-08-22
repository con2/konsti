import { addMinutes, startOfMinute } from "date-fns";
import { AnyBulkWriteOperation } from "mongoose";
import { unique } from "remeda";
import { MongoDbError } from "shared/types/api/errors";
import {
  NewEventLogItem,
  PostEventLogIsSeenRequest,
} from "shared/types/api/eventLog";
import { EventLogAction, EventLogItem } from "shared/types/models/eventLog";
import {
  Result,
  makeErrorResult,
  makeSuccessResult,
} from "shared/utils/result";
import { UserModel, UserSchemaDb } from "server/features/user/userSchema";
import { logger } from "server/utils/logger";

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
      new Error(
        `MongoDB: Error adding ${newEventLogItems.length} event log items (${String(actions)}) for ${usernames.length} users ${String(usernames)}`,
        { cause: error },
      ),
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
        new Error(`Error validating updateEventLogItemIsSeen DB value`, {
          cause: result.error,
        }),
      );
      return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
    }

    return makeSuccessResult(result.data.eventLogItems);
  } catch (error) {
    logger.error(
      new Error(`MongoDB: Error updating event log item for user ${username}`, {
        cause: error,
      }),
    );
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

// Usernames are required rather than optional: an omitted argument would silently widen
// this to every user in the database, which is never what a caller means to ask for
export const deleteEventLogItemsByStartTime = async (
  startTime: string,
  actions: EventLogAction[],
  usernames: readonly string[],
): Promise<Result<void, MongoDbError>> => {
  if (usernames.length === 0) {
    return makeSuccessResult();
  }

  const startOfStartTimeMinute = startOfMinute(new Date(startTime));

  try {
    await UserModel.updateMany(
      { username: { $in: usernames } },
      {
        $pull: {
          eventLogItems: {
            // Matched to the minute, the same tolerance every other start time comparison
            // uses, so a stored time carrying seconds still matches the assignment time
            programItemStartTime: {
              $gte: startOfStartTimeMinute,
              $lt: addMinutes(startOfStartTimeMinute, 1),
            },
            action: { $in: actions },
          },
        },
      },
      // Update validators are on globally, and they read the range operators above as a
      // document to validate rather than as a match, failing on the missing fields. This
      // update only removes array entries, so there is nothing to validate
      { runValidators: false },
    );
    return makeSuccessResult();
  } catch (error) {
    logger.error(
      new Error(`Deleting event log items for startTime ${startTime} failed`, {
        cause: error,
      }),
    );
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};
