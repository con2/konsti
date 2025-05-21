import dayjs from "dayjs";
import { groupBy, shuffle } from "remeda";
import { z } from "zod";
import {
  findProgramItemById,
  findProgramItems,
} from "server/features/program-item/programItemRepository";
import {
  DirectSignupsForProgramItem,
  SignupRepositoryAddSignupResponse,
  SignupRepositoryAddSignup,
  UserDirectSignup,
} from "server/features/direct-signup/directSignupTypes";
import {
  DirectSignupSchemaDb,
  SignupModel,
} from "server/features/direct-signup/directSignupSchema";
import { logger } from "server/utils/logger";
import { MongoDbError } from "shared/types/api/errors";
import {
  Result,
  isErrorResult,
  makeErrorResult,
  makeSuccessResult,
  unwrapResult,
} from "shared/utils/result";
import { isLotterySignupProgramItem } from "shared/utils/isLotterySignupProgramItem";
import { convertDatesToStrings } from "server/utils/convertDatesToStrings";

export const removeDirectSignups = async (): Promise<
  Result<void, MongoDbError>
> => {
  logger.info("MongoDB: remove ALL direct signups from db");
  try {
    await SignupModel.deleteMany({});
    return makeSuccessResult();
  } catch (error) {
    logger.error("MongoDB: Error removing direct signups: %s", error);
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

export const findDirectSignups = async (): Promise<
  Result<DirectSignupsForProgramItem[], MongoDbError>
> => {
  try {
    const response = await SignupModel.find(
      {},
      "-createdAt -updatedAt -_id -__v -userSignups._id",
    ).lean();

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!response) {
      logger.info("MongoDB: Direct signups not found");
      return makeSuccessResult([]);
    }

    logger.debug("MongoDB: Direct signups found");

    const result = z.array(DirectSignupSchemaDb).safeParse(response);
    if (!result.success) {
      logger.error(
        "%s",
        new Error(
          `Error validating findDirectSignups DB value: ${JSON.stringify(result.error)}`,
        ),
      );
      return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
    }

    return makeSuccessResult(convertDatesToStrings(result.data));
  } catch (error) {
    logger.error("MongoDB: Error finding direct signups: %s", error);
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

interface FindDirectSignupsByProgramTypesResponse extends UserDirectSignup {
  programItemId: string;
}

export const findDirectSignupsByStartTime = async (
  startTime: string,
): Promise<Result<FindDirectSignupsByProgramTypesResponse[], MongoDbError>> => {
  const programItemsResult = await findProgramItems();
  if (isErrorResult(programItemsResult)) {
    return programItemsResult;
  }
  const programItems = unwrapResult(programItemsResult);

  const programItemsByProgramTypesForStartTimeIds = programItems
    .filter((programItem) =>
      dayjs(programItem.startTime).isSame(dayjs(startTime)),
    )
    .map((programItem) => programItem.programItemId);

  try {
    const signups = await SignupModel.find(
      {
        programItemId: { $in: programItemsByProgramTypesForStartTimeIds },
      },
      "-createdAt -updatedAt -_id -__v",
    ).lean();
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!signups) {
      logger.info(`MongoDB: Signups for time ${startTime} not found`);
      return makeSuccessResult([]);
    }

    logger.debug(`MongoDB: Found signups for time ${startTime}`);

    const formattedResponse: FindDirectSignupsByProgramTypesResponse[] =
      convertDatesToStrings(signups).flatMap((signup) => {
        return signup.userSignups.map((userSignup) => ({
          ...userSignup,
          programItemId: signup.programItemId,
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
      "-createdAt -updatedAt -_id -__v -userSignups._id",
    ).lean();
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!response) {
      logger.info(`MongoDB: Signups for user ${username} not found`);
      return makeSuccessResult([]);
    }

    logger.debug(`MongoDB: Found signups for user ${username}`);

    const result = z.array(DirectSignupSchemaDb).safeParse(response);
    if (!result.success) {
      logger.error(
        "%s",
        new Error(
          `Error validating findUserDirectSignups DB value: ${JSON.stringify(result.error)}`,
        ),
      );
      return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
    }

    return makeSuccessResult(convertDatesToStrings(result.data));
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
  const {
    username,
    directSignupProgramItemId,
    signedToStartTime,
    message,
    priority,
  } = signupsRequest;

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
        programItemId: directSignupProgramItemId,
        count: { $lt: programItem.maxAttendance },
        "userSignups.username": { $ne: username },
      },
      {
        $addToSet: {
          userSignups: {
            username,
            priority,
            signedToStartTime,
            message,
          },
        },
        $inc: { count: 1 },
      },
      {
        new: true,
      },
    ).lean();
    if (!signup) {
      logger.warn(
        `Saving signup for user '${username}' failed: program item '${directSignupProgramItemId}' not found or program item full`,
      );
      return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
    }
    logger.info(`MongoDB: Signup saved for user ${username}`);

    const result = DirectSignupSchemaDb.safeParse(signup);
    if (!result.success) {
      logger.error(
        "%s",
        new Error(
          `Error validating saveDirectSignup DB value: ${JSON.stringify(result.error)}`,
        ),
      );
      return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
    }

    return makeSuccessResult(convertDatesToStrings(result.data));
  } catch (error) {
    logger.error(
      `MongoDB: Error saving signup for user '${username}': %s`,
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
            programItemId: programItem.programItemId,
          },
          update: {
            $addToSet: {
              userSignups: finalSignups.map((signup) => ({
                username: signup.username,
                priority: signup.priority,
                signedToStartTime: signup.signedToStartTime,
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
    logger.error("MongoDB: Error saving direct signups: %s", error);
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

interface DelDirectSignupParams {
  directSignupProgramItemId: string;
  username: string;
}

export const delDirectSignup = async ({
  directSignupProgramItemId,
  username,
}: DelDirectSignupParams): Promise<
  Result<DirectSignupsForProgramItem, MongoDbError>
> => {
  try {
    const signup = await SignupModel.findOneAndUpdate(
      {
        programItemId: directSignupProgramItemId,
        "userSignups.username": username,
      },
      {
        $pull: {
          userSignups: {
            username,
          },
        },
        $inc: { count: -1 },
      },
      { new: true },
    ).lean();

    if (!signup) {
      logger.error(
        "%s",
        new Error(
          `Signups to program item ${directSignupProgramItemId} for user ${username} not found`,
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
          `Error removing signup to program item ${directSignupProgramItemId} from user ${username}`,
        ),
      );
      return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
    }

    logger.info(
      `MongoDB: Signup removed for program item ${
        directSignupProgramItemId
      } from user ${username}`,
    );

    const result = DirectSignupSchemaDb.safeParse(signup);
    if (!result.success) {
      logger.error(
        "%s",
        new Error(
          `Error validating delDirectSignup DB value: ${JSON.stringify(result.error)}`,
        ),
      );
      return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
    }

    return makeSuccessResult(convertDatesToStrings(result.data));
  } catch (error) {
    logger.error(
      `MongoDB: Error deleting signup to program item ${directSignupProgramItemId} from user ${username}: %s`,
      error,
    );
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

export const delDirectSignupDocumentsByProgramItemIds = async (
  programItemIds: string[],
): Promise<Result<void, MongoDbError>> => {
  try {
    await SignupModel.deleteMany({
      programItemId: { $in: programItemIds },
    });
    return makeSuccessResult();
  } catch (error) {
    logger.error(
      "MongoDB: Error removing signup documents for program item IDs: %s",
      error,
    );
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

export const resetDirectSignupsByProgramItemIds = async (
  programItemIds: readonly string[],
): Promise<Result<void, MongoDbError>> => {
  try {
    await SignupModel.updateMany(
      {
        programItemId: { $in: programItemIds },
      },
      { userSignups: [], count: 0 },
    );
    return makeSuccessResult();
  } catch (error) {
    logger.error(
      "MongoDB: Error removing signups for program item IDs: %s",
      error,
    );
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

export const delAssignmentDirectSignupsByStartTime = async (
  assignmentTime: string,
): Promise<Result<void, MongoDbError>> => {
  const programItemsResult = await findProgramItems();
  if (isErrorResult(programItemsResult)) {
    return programItemsResult;
  }
  const programItems = unwrapResult(programItemsResult);

  // Only remove "twoPhaseSignupProgramTypes" signups and don't remove "directSignupAlwaysOpen" signups
  const doNotRemoveProgramItemIds = programItems
    .filter((programItem) => !isLotterySignupProgramItem(programItem))
    .map((programItem) => programItem.programItemId);

  try {
    await SignupModel.updateMany(
      {
        programItemId: { $nin: doNotRemoveProgramItemIds },
      },
      [
        {
          $set: {
            userSignups: {
              $filter: {
                input: "$userSignups",
                as: "userSignup",
                cond: {
                  $ne: [
                    "$$userSignup.signedToStartTime",
                    new Date(assignmentTime),
                  ],
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
    logger.info(
      `MongoDB: Deleted old signups for assignmentTime: ${assignmentTime}`,
    );
    return makeSuccessResult();
  } catch (error) {
    logger.error("MongoDB: Error removing invalid signup: %s", error);
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

export const createEmptyDirectSignupDocumentForProgramItems = async (
  programItemIds: string[],
): Promise<Result<void, MongoDbError>> => {
  const signupDocs = programItemIds.map((programItemId) => {
    return new SignupModel({
      programItemId,
      userSignups: [],
      count: 0,
    });
  });

  try {
    await SignupModel.create(signupDocs);
    logger.info(
      `MongoDB: Signup collection created for ${programItemIds.length} program items `,
    );
    return makeSuccessResult();
  } catch (error) {
    logger.error(
      `MongoDB: Creating signup collection for ${programItemIds.length} program items failed: %s`,
      error,
    );
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};
