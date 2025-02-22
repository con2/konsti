import dayjs from "dayjs";
import { groupBy, shuffle } from "lodash-es";
import { ObjectId } from "mongoose";
import {
  findProgramItemById,
  findProgramItems,
} from "server/features/program-item/programItemRepository";
import {
  DirectSignupsForProgramItem,
  SignupRepositoryAddSignupResponse,
  SignupRepositoryAddSignup,
  SignupRepositoryDeleteSignup,
  UserDirectSignup,
} from "server/features/direct-signup/directSignupTypes";
import { SignupModel } from "server/features/direct-signup/directSignupSchema";
import { logger } from "server/utils/logger";
import { config } from "shared/config";
import { MongoDbError } from "shared/types/api/errors";
import { ProgramType } from "shared/types/models/programItem";
import {
  Result,
  isErrorResult,
  makeErrorResult,
  makeSuccessResult,
  unwrapResult,
} from "shared/utils/result";

export const removeDirectSignups = async (): Promise<
  Result<void, MongoDbError>
> => {
  logger.info("MongoDB: remove ALL direct signups from db");
  try {
    await SignupModel.deleteMany({});
    return makeSuccessResult(undefined);
  } catch (error) {
    logger.error("MongoDB: Error removing direct signups: %s", error);
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

export const findDirectSignups = async (): Promise<
  Result<DirectSignupsForProgramItem[], MongoDbError>
> => {
  try {
    const results = await SignupModel.find(
      {},
      "-createdAt -updatedAt -_id -__v -userSignups._id",
    )
      .lean<DirectSignupsForProgramItem[]>()
      .populate("programItem", "-createdAt -updatedAt -_id -__v");

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!results) {
      logger.info(`MongoDB: Direct signups not found`);
      return makeSuccessResult([]);
    }

    logger.debug(`MongoDB: Direct signups found`);

    const resultsWithFormattedTime = results
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      .filter((result) => result.programItem) // Filter results with failed populate
      .map((result) => {
        return {
          ...result,
          userSignups: result.userSignups.map((userSignup) => {
            return {
              ...userSignup,
              time: dayjs(userSignup.time).toISOString(),
            };
          }),
        };
      });
    return makeSuccessResult(resultsWithFormattedTime);
  } catch (error) {
    logger.error("MongoDB: Error finding direct signups: %s", error);
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

interface FindDirectSignupsByProgramTypesResponse extends UserDirectSignup {
  programItemId: string;
}

export const findDirectSignupsByProgramTypes = async (
  programTypes: ProgramType[],
  startTime: string,
): Promise<Result<FindDirectSignupsByProgramTypesResponse[], MongoDbError>> => {
  const programItemsResult = await findProgramItems();
  if (isErrorResult(programItemsResult)) {
    return programItemsResult;
  }
  const programItems = unwrapResult(programItemsResult);

  const programItemsByProgramTypesForStartTimeObjectIds = programItems
    .filter((programItem) =>
      dayjs(programItem.startTime).isSame(dayjs(startTime)),
    )
    .filter((programItem) => programTypes.includes(programItem.programType))
    .map((programItem) => programItem._id);

  try {
    const signups = await SignupModel.find(
      { programItem: { $in: programItemsByProgramTypesForStartTimeObjectIds } },
      "-createdAt -updatedAt -_id -__v",
    )
      .lean<DirectSignupsForProgramItem[]>()
      .populate("programItem", "-createdAt -updatedAt -_id -__v");
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!signups) {
      logger.info(`MongoDB: Signups for time ${startTime} not found`);
      return makeSuccessResult([]);
    }

    logger.debug(`MongoDB: Found signups for time ${startTime}`);

    const formattedResponse: FindDirectSignupsByProgramTypesResponse[] =
      signups.flatMap((signup) => {
        return signup.userSignups.map((userSignup) => ({
          ...userSignup,
          programItemId: signup.programItem.programItemId,
        }));
      });

    return makeSuccessResult(formattedResponse);
  } catch (error) {
    logger.error(
      `MongoDB: Error finding signups for time ${startTime}: %s`,
      error,
    );
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

export const findUserDirectSignups = async (
  username: string,
): Promise<Result<DirectSignupsForProgramItem[], MongoDbError>> => {
  try {
    const response = await SignupModel.find(
      { "userSignups.username": username },
      "-createdAt -updatedAt -_id -__v",
    )
      .lean<DirectSignupsForProgramItem[]>()
      .populate("programItem", "-createdAt -updatedAt -_id -__v");
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!response) {
      logger.info(`MongoDB: Signups for user ${username} not found`);
      return makeSuccessResult([]);
    }

    logger.debug(`MongoDB: Found signups for user ${username}`);
    return makeSuccessResult(response);
  } catch (error) {
    logger.error(
      `MongoDB: Error finding signups for user ${username}: %s`,
      error,
    );
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

export const saveDirectSignup = async (
  signupsRequest: SignupRepositoryAddSignup,
): Promise<Result<DirectSignupsForProgramItem, MongoDbError>> => {
  const { username, directSignupProgramItemId, startTime, message, priority } =
    signupsRequest;

  // TODO: Remove fetching program item
  const programItemResult = await findProgramItemById(
    directSignupProgramItemId,
  );
  if (isErrorResult(programItemResult)) {
    return programItemResult;
  }
  const programItem = unwrapResult(programItemResult);

  try {
    const signup = await SignupModel.findOneAndUpdate(
      {
        programItem: programItem._id,
        count: { $lt: programItem.maxAttendance },
        "userSignups.username": { $ne: username },
      },
      {
        $addToSet: {
          userSignups: {
            username,
            priority,
            time: startTime,
            message,
          },
        },
        $inc: { count: 1 },
      },
      {
        new: true,
        fields: "-userSignups._id -_id -__v -createdAt -updatedAt",
      },
    )
      .lean<DirectSignupsForProgramItem>()
      .populate("programItem");
    if (!signup) {
      logger.warn(
        `Saving signup for user ${username} failed: program item ${programItem.programItemId} not found or program item full`,
      );
      return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
    }
    logger.info(`MongoDB: Signup saved for user ${username}`);
    return makeSuccessResult(signup);
  } catch (error) {
    logger.error(
      `MongoDB: Error saving signup for user ${username}: %s`,
      error,
    );
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

export const saveDirectSignups = async (
  signupsRequests: SignupRepositoryAddSignup[],
): Promise<Result<SignupRepositoryAddSignupResponse, MongoDbError>> => {
  const programItemsResult = await findProgramItems();
  if (isErrorResult(programItemsResult)) {
    return programItemsResult;
  }
  const programItems = unwrapResult(programItemsResult);

  const signupsByProgramItems = groupBy(
    signupsRequests,
    (signupsRequest) => signupsRequest.directSignupProgramItemId,
  );

  const droppedSignups: SignupRepositoryAddSignup[] = [];

  const bulkOps = Object.entries(signupsByProgramItems).flatMap(
    ([programItemId, directSignups]) => {
      const programItem = programItems.find(
        (p) => p.programItemId === programItemId,
      );
      if (!programItem) {
        return [];
      }

      let finalSignups: SignupRepositoryAddSignup[] = directSignups;
      if (directSignups.length > programItem.maxAttendance) {
        logger.error(
          "%s",
          new Error(
            `Too many signups passed to saveSignups for program item ${programItem.programItemId} - maxAttendance: ${programItem.maxAttendance}, direct signups: ${directSignups.length}`,
          ),
        );
        const shuffledSignups = shuffle(directSignups);
        finalSignups = shuffledSignups.slice(0, programItem.maxAttendance);
        droppedSignups.push(
          ...shuffledSignups.slice(programItem.maxAttendance),
        );
      }

      return {
        updateOne: {
          filter: {
            programItem: programItem._id,
          },
          update: {
            $addToSet: {
              userSignups: finalSignups.map((signup) => ({
                username: signup.username,
                priority: signup.priority,
                time: signup.startTime,
                message: signup.message,
              })),
            },
            count: finalSignups.length,
          },
        },
      };
    },
  );

  try {
    const response = await SignupModel.bulkWrite(bulkOps);
    logger.info(`Updated signups for ${response.modifiedCount} program items`);
    return makeSuccessResult({
      modifiedCount: response.modifiedCount,
      droppedSignups,
    });
  } catch (error) {
    logger.error(`MongoDB: Error saving direct signups: %s`, error);
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

export const delDirectSignup = async (
  signupRequest: SignupRepositoryDeleteSignup,
): Promise<Result<DirectSignupsForProgramItem, MongoDbError>> => {
  const { username, directSignupProgramItemId } = signupRequest;

  // TODO: Remove fetching program item
  const programItemResult = await findProgramItemById(
    directSignupProgramItemId,
  );
  if (isErrorResult(programItemResult)) {
    return programItemResult;
  }
  const programItem = unwrapResult(programItemResult);

  try {
    const signup = await SignupModel.findOneAndUpdate(
      { programItem: programItem._id, "userSignups.username": username },
      {
        $pull: {
          userSignups: {
            username,
          },
        },
        $inc: { count: -1 },
      },
      { new: true, fields: "-userSignups._id -_id -__v -createdAt -updatedAt" },
    )
      .lean<DirectSignupsForProgramItem>()
      .populate("programItem", "-createdAt -updatedAt -_id -__v");

    if (!signup) {
      logger.error(
        "%s",
        new Error(
          `Signups to program item ${programItem.programItemId} for user ${username} not found`,
        ),
      );
      return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
    }

    const signupStillRemaining = signup.userSignups.some(
      (userSignup) => userSignup.username === username,
    );

    if (signupStillRemaining) {
      logger.error(
        "%s",
        new Error(
          `Error removing signup to program item ${programItem.programItemId} from user ${username}`,
        ),
      );
      return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
    }

    logger.info(
      `MongoDB: Signup removed - program item: ${
        programItem.programItemId
      }, user: ${username}, starting: ${dayjs(programItem.startTime).toISOString()}`,
    );
    return makeSuccessResult(signup);
  } catch (error) {
    logger.error(
      `MongoDB: Error deleting signup to program item ${programItem.programItemId} from user ${username}: %s`,
      error,
    );
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

export const delDirectSignupDocumentsByProgramItemIds = async (
  programItemIds: string[],
): Promise<Result<void, MongoDbError>> => {
  const programItemsResult = await findProgramItems();
  if (isErrorResult(programItemsResult)) {
    return programItemsResult;
  }
  const programItems = unwrapResult(programItemsResult);

  const programItemsInDb = programItemIds.map((programItemId) =>
    programItems.find(
      (programItem) => programItem.programItemId === programItemId,
    ),
  );

  const programItemObjectIds = programItemsInDb.flatMap(
    (programItemInDb) => programItemInDb?._id ?? [],
  );

  try {
    await SignupModel.deleteMany({
      programItem: { $in: programItemObjectIds },
    });
    return makeSuccessResult(undefined);
  } catch (error) {
    logger.error(
      "MongoDB: Error removing signup documents for program item IDs: %s",
      error,
    );
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

export const resetDirectSignupsByProgramItemIds = async (
  programItemIds: string[],
): Promise<Result<void, MongoDbError>> => {
  const programItemsResult = await findProgramItems();
  if (isErrorResult(programItemsResult)) {
    return programItemsResult;
  }
  const programItems = unwrapResult(programItemsResult);

  const programItemsInDb = programItemIds.map((programItemId) =>
    programItems.find(
      (programItem) => programItem.programItemId === programItemId,
    ),
  );

  const programItemObjectIds = programItemsInDb.flatMap(
    (programItemInDb) => programItemInDb?._id ?? [],
  );

  try {
    await SignupModel.updateMany(
      {
        programItem: { $in: programItemObjectIds },
      },
      { userSignups: [], count: 0 },
    );
    return makeSuccessResult(undefined);
  } catch (error) {
    logger.error(
      "MongoDB: Error removing signups for program item IDs: %s",
      error,
    );
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

export const delAssignmentDirectSignupsByStartTime = async (
  startTime: string,
): Promise<Result<void, MongoDbError>> => {
  const programItemsResult = await findProgramItems();
  if (isErrorResult(programItemsResult)) {
    return programItemsResult;
  }
  const programItems = unwrapResult(programItemsResult);

  // Only remove "twoPhaseSignupProgramTypes" signups and don't remove "directSignupAlwaysOpen" signups
  const doNotRemoveProgramItemObjectIds = programItems
    .filter(
      (programItem) =>
        config
          .event()
          .directSignupAlwaysOpenIds.includes(programItem.programItemId) ||
        !config
          .event()
          .twoPhaseSignupProgramTypes.includes(programItem.programType),
    )
    .map((programItem) => programItem._id);

  try {
    await SignupModel.updateMany(
      {
        programItem: { $nin: doNotRemoveProgramItemObjectIds },
      },
      [
        {
          $set: {
            userSignups: {
              $filter: {
                input: "$userSignups",
                as: "userSignup",
                cond: {
                  $ne: ["$$userSignup.time", new Date(startTime)],
                },
              },
            },
          },
        },
        {
          $set: { count: { $size: "$userSignups" } },
        },
      ],
    );
    logger.info(`MongoDB: Deleted old signups for startTime: ${startTime}`);
    return makeSuccessResult(undefined);
  } catch (error) {
    logger.error("MongoDB: Error removing invalid signup: %s", error);
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

export const createEmptyDirectSignupDocumentForProgramItems = async (
  programItemObjectIds: ObjectId[],
): Promise<Result<void, MongoDbError>> => {
  const signupDocs = programItemObjectIds.map((programItemObjectId) => {
    return new SignupModel({
      programItem: programItemObjectId,
      userSignups: [],
      count: 0,
    });
  });

  try {
    await SignupModel.create(signupDocs);
    logger.info(
      `MongoDB: Signup collection created for ${programItemObjectIds.length} program items `,
    );
    return makeSuccessResult(undefined);
  } catch (error) {
    logger.error(
      `MongoDB: Creating signup collection for ${programItemObjectIds.length} program items failed: %s`,
      error,
    );
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};
