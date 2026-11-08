import { AnyBulkWriteOperation } from "mongoose";
import { unique } from "remeda";
import { MongoDbError } from "shared/types/api/errors";
import {
  NewEventLogItem,
  PostEventLogIsSeenRequest,
} from "shared/types/api/eventLog";
import { EventLogItem } from "shared/types/models/eventLog";
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
            userId: newEventLogItem.userId,
          },
          update: {
            $addToSet: {
              eventLogItems: {
                action: newEventLogItem.action,
                programItemId: newEventLogItem.programItemId,
                programItemStartTime: new Date(
                  newEventLogItem.programItemStartTime,
                ),
                ...(newEventLogItem.lastProgramItemEndTime !== undefined && {
                  lastProgramItemEndTime: new Date(
                    newEventLogItem.lastProgramItemEndTime,
                  ),
                }),
                ...(newEventLogItem.programType !== undefined && {
                  programType: newEventLogItem.programType,
                }),
                isSeen: false,
                createdAt: new Date(newEventLogItem.createdAt),
              },
            },
          },
        },
      };
    },
  );

  const userIds = unique(
    newEventLogItems.map((newEventLogItem) => newEventLogItem.userId),
  );
  const actions = unique(
    newEventLogItems.map((newEventLogItem) => newEventLogItem.action),
  );

  try {
    await UserModel.bulkWrite(bulkOps);
    logger.info(
      `MongoDB: Added ${newEventLogItems.length} event log items (${String(actions)}) for ${userIds.length} users`,
    );
    logger.debug(`Event log items added for users: ${String(userIds)}`);
    return makeSuccessResult();
  } catch (error) {
    logger.error(
      new Error(
        `MongoDB: Error adding ${newEventLogItems.length} event log items (${String(actions)}) for ${userIds.length} users ${String(userIds)}`,
        { cause: error },
      ),
    );
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

export const updateEventLogItemIsSeen = async (
  request: PostEventLogIsSeenRequest,
  userId: string,
): Promise<Result<EventLogItem[], MongoDbError>> => {
  const { eventLogItemId, isSeen } = request;
  try {
    const response = await UserModel.findOneAndUpdate(
      { userId, "eventLogItems._id": eventLogItemId },
      {
        $set: { "eventLogItems.$[logItem].isSeen": isSeen },
      },
      {
        arrayFilters: [{ "logItem._id": eventLogItemId }],
        returnDocument: "after",
      },
    ).lean();

    if (!response) {
      logger.info(`MongoDB: updateEventLogItemIsSeen user ${userId} not found`);
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
      new Error(`MongoDB: Error updating event log item for user ${userId}`, {
        cause: error,
      }),
    );
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};
