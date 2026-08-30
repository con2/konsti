import { AnyBulkWriteOperation } from "mongoose";
import { countBy, first, groupBy } from "remeda";
import { MongoDbError } from "shared/types/api/errors";
import { ProgramItem } from "shared/types/models/programItem";
import {
  Result,
  makeErrorResult,
  makeSuccessResult,
} from "shared/utils/result";
import { isSameTime } from "shared/utils/timeComparison";
import {
  DirectSignupSchemaDb,
  SignupModel,
} from "server/features/direct-signup/directSignupSchema";
import {
  DirectSignupsForProgramItem,
  SignupRepositoryAddSignup,
  SignupRepositoryAddSignupResponse,
  UserDirectSignup,
} from "server/features/direct-signup/directSignupTypes";
import { findProgramItemById } from "server/features/program-item/programItemRepository";
import { logger } from "server/utils/logger";

export const removeDirectSignups = async (): Promise<
  Result<void, MongoDbError>
> => {
  logger.info("MongoDB: remove ALL direct signups from db");
  try {
    await SignupModel.deleteMany({});
    return makeSuccessResult();
  } catch (error) {
    logger.error(
      new Error("MongoDB: Error removing direct signups", { cause: error }),
    );
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

// A document that cannot be read is skipped rather than failing the whole query, so one unreadable
// row does not hide every other sign-up. The query name locates the caller in the log
const parseSignupDocuments = (
  responses: readonly { programItemId: string }[],
  queryName: string,
): DirectSignupsForProgramItem[] =>
  responses.flatMap((response) => {
    const result = DirectSignupSchemaDb.safeParse(response);
    if (!result.success) {
      logger.error(
        new Error(
          `Error validating ${queryName} DB value: programItemId: ${response.programItemId}`,
          { cause: result.error },
        ),
      );
      return [];
    }
    return result.data;
  });

export const findDirectSignups = async (): Promise<
  Result<DirectSignupsForProgramItem[], MongoDbError>
> => {
  try {
    const responses = await SignupModel.find({}).lean();

    logger.debug("MongoDB: Direct signups found");

    return makeSuccessResult(
      parseSignupDocuments(responses, "findDirectSignups"),
    );
  } catch (error) {
    logger.error(
      new Error("MongoDB: Error finding direct signups", { cause: error }),
    );
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

interface SignupDocuments {
  signups: DirectSignupsForProgramItem[];
  // Which program items have a document at all, readable or not. A write that does not upsert
  // stores nothing when there is none, where an unreadable one says only that a check cannot tell
  presentProgramItemIds: Set<string>;
}

const findSignupDocumentsByProgramItemIds = async (
  programItemIds: string[],
  queryName: string,
): Promise<Result<SignupDocuments, MongoDbError>> => {
  try {
    const responses = await SignupModel.find({
      programItemId: { $in: programItemIds },
    }).lean();

    return makeSuccessResult({
      signups: parseSignupDocuments(responses, queryName),
      presentProgramItemIds: new Set(
        responses.map((response) => response.programItemId),
      ),
    });
  } catch (error) {
    logger.error(
      new Error(
        `MongoDB: Error finding direct signups for program items ${programItemIds.join(", ")}`,
        { cause: error },
      ),
    );
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

export const findDirectSignupsByProgramItemIds = async (
  programItemIds: string[],
): Promise<Result<DirectSignupsForProgramItem[], MongoDbError>> => {
  const documentsResult = await findSignupDocumentsByProgramItemIds(
    programItemIds,
    "findDirectSignupsByProgramItemIds",
  );
  if (!documentsResult.ok) {
    return documentsResult;
  }
  const { signups } = documentsResult.value;

  if (signups.length === 0) {
    logger.info(
      `MongoDB: No direct signups found for program item IDs: ${programItemIds.join(", ")}`,
    );
    return makeSuccessResult([]);
  }

  logger.debug(
    `MongoDB: Found ${signups.length} direct signups for program item IDs: ${programItemIds.join(", ")}`,
  );

  return makeSuccessResult(signups);
};

interface FindDirectSignupsByStartTimeResponse extends UserDirectSignup {
  programItemId: string;
}

// Matched on each program item's own start time: a spot is held for the hour its attendee turns
// up, and the parent override only says when a batch is lotteried
export const findDirectSignupsByStartTimes = async (
  startTimes: readonly string[],
  programItems: ProgramItem[],
): Promise<Result<FindDirectSignupsByStartTimeResponse[], MongoDbError>> => {
  const programItemsIds = programItems
    .filter((programItem) =>
      startTimes.some((startTime) =>
        isSameTime(programItem.startTime, startTime),
      ),
    )
    .map((programItem) => programItem.programItemId);

  try {
    const response = await SignupModel.find({
      programItemId: { $in: programItemsIds },
    }).lean();

    logger.debug(`MongoDB: Found signups for times ${startTimes.join(", ")}`);

    const signups = parseSignupDocuments(
      response,
      "findDirectSignupsByStartTimes",
    );

    const formattedResponse: FindDirectSignupsByStartTimeResponse[] =
      signups.flatMap((signup) => {
        return signup.userSignups.map((userSignup) => ({
          ...userSignup,
          programItemId: signup.programItemId,
        }));
      });

    return makeSuccessResult(formattedResponse);
  } catch (error) {
    logger.error(
      new Error(
        `MongoDB: Error finding signups for times ${startTimes.join(", ")}`,
        {
          cause: error,
        },
      ),
    );
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

export const findUserDirectSignups = async (
  username: string,
): Promise<Result<DirectSignupsForProgramItem[], MongoDbError>> => {
  try {
    const response = await SignupModel.find({
      "userSignups.username": username,
    }).lean();

    logger.debug(`MongoDB: Found signups for user ${username}`);

    return makeSuccessResult(
      parseSignupDocuments(response, "findUserDirectSignups"),
    );
  } catch (error) {
    logger.error(
      new Error(`MongoDB: Error finding signups for user ${username}`, {
        cause: error,
      }),
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
    signupTime,
    message,
    priority,
  } = signupsRequest;

  // TODO: Remove fetching program item
  const programItemResult = await findProgramItemById(
    directSignupProgramItemId,
  );
  if (!programItemResult.ok) {
    return programItemResult;
  }
  try {
    const response = await SignupModel.findOneAndUpdate(
      {
        programItemId: directSignupProgramItemId,
        count: { $lt: programItemResult.value.maxAttendance },
        "userSignups.username": { $ne: username },
      },
      {
        $addToSet: {
          userSignups: {
            username,
            priority,
            signedToStartTime,
            signupTime,
            message,
          },
        },
        $inc: { count: 1 },
      },
      {
        returnDocument: "after",
      },
    ).lean();

    // No response means the program item's sign-up document was not found or the program item is full
    if (!response) {
      const signupsResult = await findDirectSignupsByProgramItemIds([
        directSignupProgramItemId,
      ]);
      if (!signupsResult.ok) {
        return signupsResult;
      }
      const signup = first(signupsResult.value);

      if (!signup) {
        logger.warn(
          `Saving direct signup for user '${username}' failed: program item '${directSignupProgramItemId}' not found`,
        );
        return makeErrorResult(MongoDbError.SIGNUP_NOT_FOUND);
      }

      return makeSuccessResult(signup);
    }

    logger.info(
      `MongoDB: Direct signup to '${directSignupProgramItemId}' saved for user "${username}"`,
    );

    const result = DirectSignupSchemaDb.safeParse(response);
    if (!result.success) {
      logger.error(
        new Error(`Error validating saveDirectSignup DB value`, {
          cause: result.error,
        }),
      );
      return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
    }

    return makeSuccessResult(result.data);
  } catch (error) {
    logger.error(
      new Error(`MongoDB: Error saving direct signup for user '${username}'`, {
        cause: error,
      }),
    );
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

// The attendance cap is applied by the write itself, so which sign-ups actually landed is
// only known afterwards. Reporting the ones that didn't lets the caller treat them as not
// placed rather than telling the attendee they got a spot that was never stored.
const findSignupsNotSaved = async (
  signupsByProgramItems: Record<string, SignupRepositoryAddSignup[]>,
): Promise<Result<SignupRepositoryAddSignup[], MongoDbError>> => {
  const documentsResult = await findSignupDocumentsByProgramItemIds(
    Object.keys(signupsByProgramItems),
    "findSignupsNotSaved",
  );
  if (!documentsResult.ok) {
    return documentsResult;
  }
  const { signups, presentProgramItemIds } = documentsResult.value;

  const savedUsernamesByProgramItemId = new Map(
    signups.map((signup) => [
      signup.programItemId,
      new Set(signup.userSignups.map((userSignup) => userSignup.username)),
    ]),
  );
  const notSaved = Object.values(signupsByProgramItems)
    .flat()
    .filter((signup) => {
      const savedUsernames = savedUsernamesByProgramItemId.get(
        signup.directSignupProgramItemId,
      );
      if (!savedUsernames) {
        // No document to update and the write does not create one, so nothing was stored.
        // Saying otherwise would send an acceptance email for a spot that does not exist.
        if (!presentProgramItemIds.has(signup.directSignupProgramItemId)) {
          logger.error(
            new Error(
              `Assignment signups for program item ${signup.directSignupProgramItemId} were not saved: it has no sign-up document`,
            ),
          );
          return true;
        }

        // The document is there but could not be read, which says nothing about the write.
        // Reporting them dropped would tell attendees holding a spot that they got none.
        logger.error(
          new Error(
            `Could not verify the assignment signups saved to program item ${signup.directSignupProgramItemId}, treating them as saved`,
          ),
        );
        return false;
      }

      return !savedUsernames.has(signup.username);
    });

  if (notSaved.length > 0) {
    const notSavedCounts = Object.entries(
      countBy(notSaved, (signup) => signup.directSignupProgramItemId),
    ).map(([programItemId, count]) => `${programItemId}: ${count}`);
    logger.error(
      new Error(
        `${notSaved.length} assignment signups did not fit the program item they were assigned to and were not saved - ${notSavedCounts.join(", ")}`,
      ),
    );
  }

  return makeSuccessResult(notSaved);
};

// Append the new sign-ups and recompute count from the resulting array in a single atomic
// pipeline update, so count can never drift from the userSignups it tallies
const appendSignupsPipeline = (
  directSignups: readonly SignupRepositoryAddSignup[],
  maxAttendance: number,
): object[] => {
  // $literal: a username is data, and one starting with "$" would otherwise be read as a field
  // path and match nothing
  const appendedUsernames = {
    $literal: directSignups.map((signup) => signup.username),
  };
  const appendedSignups = {
    $literal: directSignups.map((signup) => ({
      username: signup.username,
      priority: signup.priority,
      signedToStartTime: new Date(signup.signedToStartTime),
      signupTime: new Date(signup.signupTime),
      message: signup.message,
    })),
  };

  return [
    {
      $set: {
        userSignups: {
          $let: {
            vars: {
              // An attendee being written keeps one entry, the new one. A program item being
              // lotteried holds no spots, so this is defence in depth: a second entry would
              // seat them twice and charge their own place against it
              keptSignups: {
                $filter: {
                  input: { $ifNull: ["$userSignups", []] },
                  cond: {
                    $not: [{ $in: ["$$this.username", appendedUsernames] }],
                  },
                },
              },
            },
            // The only cap on the attendance limit, and it runs on the array as it stands rather
            // than on a count read beforehand. Never below the attendees this write leaves alone,
            // so an over-full program item loses only the ones being written.
            in: {
              $slice: [
                { $concatArrays: ["$$keptSignups", appendedSignups] },
                { $max: [maxAttendance, { $size: "$$keptSignups" }] },
              ],
            },
          },
        },
      },
    },
    {
      $set: { count: { $size: "$userSignups" } },
    },
  ];
};

export const saveDirectSignups = async (
  signupsRequests: SignupRepositoryAddSignup[],
  programItems: ProgramItem[],
): Promise<Result<SignupRepositoryAddSignupResponse, MongoDbError>> => {
  const signupsByProgramItems = groupBy(
    signupsRequests,
    (signupsRequest) => signupsRequest.directSignupProgramItemId,
  );

  const bulkOps: AnyBulkWriteOperation[] = Object.entries(
    signupsByProgramItems,
  ).flatMap(([programItemId, directSignups]) => {
    const programItem = programItems.find(
      (p) => p.programItemId === programItemId,
    );
    if (!programItem) {
      return [];
    }

    return {
      updateOne: {
        filter: {
          programItemId: programItem.programItemId,
        },
        update: appendSignupsPipeline(directSignups, programItem.maxAttendance),
      },
    };
  });

  try {
    const response = await SignupModel.bulkWrite(bulkOps);
    logger.info(`Updated signups for ${response.modifiedCount} program items`);

    const notSavedResult = await findSignupsNotSaved(signupsByProgramItems);
    if (!notSavedResult.ok) {
      // The write has landed by now, so failing the caller here would abort a lottery run that
      // has already placed people. The unverified ones read as saved, like a skipped document.
      logger.error(
        new Error(
          `Could not verify which assignment signups were saved, treating them as saved: ${notSavedResult.error}`,
        ),
      );
    }

    return makeSuccessResult({
      modifiedCount: response.modifiedCount,
      droppedSignups: notSavedResult.ok ? notSavedResult.value : [],
    });
  } catch (error) {
    logger.error(
      new Error("MongoDB: Error saving direct signups", { cause: error }),
    );
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

interface DelDirectSignupParams {
  directSignupProgramItemId: string;
  username: string;
}

// Drop the user's sign-ups and recompute count from what is left, rather than decrementing it.
// count gates the sign-up endpoint's capacity check, and a decrement drifts from the array
// whenever it removes more than one entry
const removeUsernamePipeline = (username: string): object[] => [
  {
    $set: {
      userSignups: {
        $filter: {
          input: "$userSignups",
          as: "userSignup",
          // $literal: a username is data, and one starting with "$" would
          // otherwise be read as a field path and match nothing
          cond: {
            $ne: ["$$userSignup.username", { $literal: username }],
          },
        },
      },
    },
  },
  {
    $set: { count: { $size: "$userSignups" } },
  },
];

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
      removeUsernamePipeline(username),
      { returnDocument: "after", updatePipeline: true },
    ).lean();

    if (!signup) {
      logger.error(
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
        new Error(
          `Error removing signup to program item ${directSignupProgramItemId} from user ${username}`,
        ),
      );
      return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
    }

    logger.info(
      `MongoDB: Direct signup to '${
        directSignupProgramItemId
      }' removed from user '${username}'`,
    );

    const result = DirectSignupSchemaDb.safeParse(signup);
    if (!result.success) {
      logger.error(
        new Error(`Error validating delDirectSignup DB value`, {
          cause: result.error,
        }),
      );
      return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
    }

    return makeSuccessResult(result.data);
  } catch (error) {
    logger.error(
      new Error(
        `MongoDB: Error deleting signup to program item ${directSignupProgramItemId} from user ${username}`,
        { cause: error },
      ),
    );
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

// Remove several users' direct sign-ups in a single bulk write instead of one round-trip each
export const delDirectSignups = async (
  signups: readonly DelDirectSignupParams[],
): Promise<Result<void, MongoDbError>> => {
  if (signups.length === 0) {
    return makeSuccessResult();
  }

  try {
    await SignupModel.bulkWrite(
      signups.map(({ directSignupProgramItemId, username }) => ({
        updateOne: {
          filter: {
            programItemId: directSignupProgramItemId,
            "userSignups.username": username,
          },
          update: removeUsernamePipeline(username),
        },
      })),
    );

    logger.info(`MongoDB: Removed ${signups.length} direct signups`);
    return makeSuccessResult();
  } catch (error) {
    logger.error(
      new Error("MongoDB: Error deleting direct signups", { cause: error }),
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
      new Error(
        "MongoDB: Error removing signup documents for program item IDs",
        {
          cause: error,
        },
      ),
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
      new Error("MongoDB: Error removing signups for program item IDs", {
        cause: error,
      }),
    );
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

export const createEmptyDirectSignupDocumentForProgramItems = async (
  programItemIds: string[],
): Promise<Result<void, MongoDbError>> => {
  if (programItemIds.length === 0) {
    return makeSuccessResult();
  }

  try {
    // $setOnInsert leaves an existing document alone, so a program item whose document appeared
    // between the caller deciding it was missing and this write keeps the sign-ups it holds
    const bulkOps: AnyBulkWriteOperation[] = programItemIds.map(
      (programItemId) => ({
        updateOne: {
          filter: { programItemId },
          update: { $setOnInsert: { userSignups: [], count: 0 } },
          upsert: true,
        },
      }),
    );
    await SignupModel.bulkWrite(bulkOps);
    logger.info(
      `MongoDB: Signup collection created for ${programItemIds.length} program items: ${programItemIds.join(", ")}`,
    );
    return makeSuccessResult();
  } catch (error) {
    logger.error(
      new Error(
        `MongoDB: Creating signup collection for ${programItemIds.length} program items failed`,
        { cause: error },
      ),
    );
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};
