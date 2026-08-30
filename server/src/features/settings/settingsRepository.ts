import { subMinutes, subSeconds } from "date-fns";
import { MongoDbError } from "shared/types/api/errors";
import { PostSettingsRequest } from "shared/types/api/settings";
import { Settings, SignupQuestion } from "shared/types/models/settings";
import {
  Result,
  makeErrorResult,
  makeSuccessResult,
} from "shared/utils/result";
import { isDuplicateKeyError } from "server/db/duplicateKeyError";
import {
  SETTINGS_SINGLETON_KEY,
  SettingsModel,
  SettingsSchemaDb,
} from "server/features/settings/settingsSchema";
import { logger } from "server/utils/logger";

// All queries target the single settings document by its unique key, so a
// concurrent create loses on duplicate key instead of inserting a second
// document that would shadow the first
const settingsFilter = { singleton: SETTINGS_SINGLETON_KEY };

export const removeSettings = async (): Promise<Result<void, MongoDbError>> => {
  logger.info("MongoDB: remove ALL settings from db");
  try {
    await SettingsModel.deleteMany({});
    return makeSuccessResult();
  } catch (error) {
    logger.error(
      new Error("MongoDB: Error removing settings", { cause: error }),
    );
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

export const createSettings = async (): Promise<
  Result<Settings, MongoDbError>
> => {
  logger.info("MongoDB: Create default settings");
  const defaultSettings = new SettingsModel();
  try {
    const settings = await defaultSettings.save();

    const result = SettingsSchemaDb.safeParse(settings.toObject());
    if (!result.success) {
      logger.error(
        new Error(`Error validating createSettings DB value`, {
          cause: result.error,
        }),
      );
      return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
    }

    logger.info("MongoDB: Default settings saved to DB");

    return makeSuccessResult(result.data);
  } catch (error) {
    // Another caller won the race and created the document; read theirs
    // instead of failing or inserting a duplicate
    if (isDuplicateKeyError(error)) {
      logger.info("MongoDB: Default settings already created, reading those");
      try {
        const existing = await SettingsModel.findOne(settingsFilter).lean();
        const existingResult = SettingsSchemaDb.safeParse(existing);
        if (!existingResult.success) {
          logger.error(
            new Error("Error validating existing settings DB value", {
              cause: existingResult.error,
            }),
          );
          return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
        }
        return makeSuccessResult(existingResult.data);
      } catch (readError) {
        logger.error(
          new Error("MongoDB: Error reading existing settings", {
            cause: readError,
          }),
        );
        return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
      }
    }

    logger.error(
      new Error("MongoDB: Add default settings error", { cause: error }),
    );
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

export const findOrCreateSettings = async (): Promise<
  Result<Settings, MongoDbError>
> => {
  try {
    const settings = await SettingsModel.findOne(settingsFilter).lean();

    if (!settings) {
      const createSettingsResult = await createSettings();
      if (!createSettingsResult.ok) {
        return createSettingsResult;
      }
      return makeSuccessResult(createSettingsResult.value);
    }

    logger.debug("MongoDB: Settings data found");

    const result = SettingsSchemaDb.safeParse(settings);
    if (!result.success) {
      logger.error(
        new Error(`Error validating findOrCreateSettings DB value`, {
          cause: result.error,
        }),
      );
      return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
    }

    return makeSuccessResult(result.data);
  } catch (error) {
    logger.error(
      new Error("MongoDB: Error finding settings data", { cause: error }),
    );
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

export const saveHidden = async (
  hiddenProgramItemIds: readonly string[],
): Promise<Result<Settings, MongoDbError>> => {
  // Create through the one designated creator rather than upserting here: a
  // second creator is what lets two documents exist in the first place
  const settingsResult = await findOrCreateSettings();
  if (!settingsResult.ok) {
    return settingsResult;
  }

  try {
    const settings = await SettingsModel.findOneAndUpdate(
      settingsFilter,
      {
        hiddenProgramItemIds,
      },
      {
        returnDocument: "after",
      },
    ).lean();
    if (!settings) {
      return makeErrorResult(MongoDbError.SETTINGS_NOT_FOUND);
    }

    logger.info("MongoDB: Hidden data updated");

    const result = SettingsSchemaDb.safeParse(settings);
    if (!result.success) {
      logger.error(
        new Error(`Error validating saveHidden DB value`, {
          cause: result.error,
        }),
      );
      return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
    }

    return makeSuccessResult(result.data);
  } catch (error) {
    logger.error(
      new Error("MongoDB: Error updating hidden program items", {
        cause: error,
      }),
    );
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

export const saveSignupQuestion = async (
  signupQuestionData: SignupQuestion,
): Promise<Result<Settings, MongoDbError>> => {
  try {
    const settings = await SettingsModel.findOneAndUpdate(
      {
        ...settingsFilter,
        "signupQuestions.programItemId": {
          $ne: signupQuestionData.programItemId,
        },
      },
      {
        $addToSet: { signupQuestions: signupQuestionData },
      },
      {
        returnDocument: "after",
      },
    ).lean();
    if (!settings) {
      return makeErrorResult(MongoDbError.SETTINGS_NOT_FOUND);
    }
    logger.info(
      `MongoDB: Signup question updated: ${JSON.stringify(signupQuestionData)}`,
    );

    const result = SettingsSchemaDb.safeParse(settings);
    if (!result.success) {
      logger.error(
        new Error(`Error validating saveSignupQuestion DB value`, {
          cause: result.error,
        }),
      );
      return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
    }

    return makeSuccessResult(result.data);
  } catch (error) {
    logger.error(
      new Error("MongoDB: Error updating program item signup question", {
        cause: error,
      }),
    );
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

export const delSignupQuestion = async (
  programItemId: string,
): Promise<Result<Settings, MongoDbError>> => {
  try {
    const settings = await SettingsModel.findOneAndUpdate(
      settingsFilter,
      {
        $pull: { signupQuestions: { programItemId } },
      },
      {
        returnDocument: "after",
      },
    ).lean();
    if (!settings) {
      logger.error(new Error("MongoDB: Signup question not found"));
      return makeErrorResult(MongoDbError.SIGNUP_QUESTION_NOT_FOUND);
    }
    logger.info("MongoDB: Signup info deleted");

    const result = SettingsSchemaDb.safeParse(settings);
    if (!result.success) {
      logger.error(
        new Error(`Error validating delSignupQuestion DB value`, {
          cause: result.error,
        }),
      );
      return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
    }

    return makeSuccessResult(result.data);
  } catch (error) {
    logger.error(
      new Error("MongoDB: Error deleting program item signup question", {
        cause: error,
      }),
    );
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

export const saveSettings = async (
  settings: PostSettingsRequest,
): Promise<Result<Settings, MongoDbError>> => {
  // Create through the one designated creator rather than upserting here: a
  // second creator is what lets two documents exist in the first place
  const existingSettingsResult = await findOrCreateSettings();
  if (!existingSettingsResult.ok) {
    return existingSettingsResult;
  }

  try {
    const updatedSettings = await SettingsModel.findOneAndUpdate(
      settingsFilter,
      settings,
      {
        returnDocument: "after",
      },
    ).lean();
    if (!updatedSettings) {
      return makeErrorResult(MongoDbError.SETTINGS_NOT_FOUND);
    }
    logger.info("MongoDB: App settings updated");

    const result = SettingsSchemaDb.safeParse(updatedSettings);
    if (!result.success) {
      logger.error(
        new Error(`Error validating saveSettings DB value`, {
          cause: result.error,
        }),
      );
      return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
    }

    return makeSuccessResult(result.data);
  } catch (error) {
    logger.error(
      new Error("MongoDB: Error updating app settings", { cause: error }),
    );
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

export const setProgramUpdateLastRun = async (
  programUpdateNextRun: string,
): Promise<Result<void, MongoDbError>> => {
  try {
    const response = await SettingsModel.findOneAndUpdate(
      {
        ...settingsFilter,
        programUpdateLastRun: {
          $lt: subSeconds(new Date(programUpdateNextRun), 30),
        },
      },
      {
        programUpdateLastRun: programUpdateNextRun,
      },
    ).lean();
    if (!response) {
      return makeErrorResult(MongoDbError.SETTINGS_NOT_FOUND);
    }
    logger.info(
      `MongoDB: Program update last run set: ${programUpdateNextRun}`,
    );
    return makeSuccessResult();
  } catch (error) {
    logger.error(
      new Error("MongoDB: Error updating program update last run", {
        cause: error,
      }),
    );
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

// A held assignment lock older than this is treated as abandoned (a run that crashed without
// releasing it) and can be reclaimed, so a crash can't deadlock assignments forever. Keep it
// comfortably longer than any real assignment run so a slow run isn't reclaimed mid-flight.
export const ASSIGNMENT_LOCK_STALE_TIMEOUT_MINUTES = 5;

// Acquire the assignment-in-progress lock if it is free or stale. Returns the lock token (the
// acquisition time) to pass to releaseAssignmentLock, or SETTINGS_NOT_FOUND if another run
// currently holds it.
export const acquireAssignmentLock = async (): Promise<
  Result<string, MongoDbError>
> => {
  const lockStartTime = new Date().toISOString();
  try {
    // Acquire if the lock is free (null) or stale (acquired longer ago than the timeout)
    const response = await SettingsModel.findOneAndUpdate(
      {
        ...settingsFilter,
        $or: [
          { assignmentInProgressStartTime: null },
          {
            assignmentInProgressStartTime: {
              $lt: subMinutes(
                new Date(lockStartTime),
                ASSIGNMENT_LOCK_STALE_TIMEOUT_MINUTES,
              ),
            },
          },
        ],
      },
      {
        assignmentInProgressStartTime: lockStartTime,
      },
    ).lean();
    if (!response) {
      // No document matched the update: either another run holds the lock, or there is no
      // settings row at all — distinguish the two so the caller can treat a missing row as a
      // genuine error rather than as "already running"
      const settingsExists = await SettingsModel.exists(settingsFilter);
      return makeErrorResult(
        settingsExists
          ? MongoDbError.ASSIGNMENT_LOCK_HELD
          : MongoDbError.SETTINGS_NOT_FOUND,
      );
    }
    logger.info(`MongoDB: Assignment lock acquired at ${lockStartTime}`);
    return makeSuccessResult(lockStartTime);
  } catch (error) {
    logger.error(
      new Error("MongoDB: Error acquiring assignment lock", { cause: error }),
    );
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

// Release the assignment-in-progress lock, but only if we still hold it (the token matches) —
// if the lock was reclaimed as stale and re-acquired by another run, this must not clobber it
export const releaseAssignmentLock = async (
  lockToken: string,
): Promise<Result<void, MongoDbError>> => {
  try {
    await SettingsModel.findOneAndUpdate(
      {
        ...settingsFilter,
        assignmentInProgressStartTime: new Date(lockToken),
      },
      {
        assignmentInProgressStartTime: null,
      },
    ).lean();
    logger.info("MongoDB: Assignment lock released");
    return makeSuccessResult();
  } catch (error) {
    logger.error(
      new Error("MongoDB: Error releasing assignment lock", { cause: error }),
    );
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

// Record the time of the last completed assignment. This is informational only — the run lock
// is acquireAssignmentLock — so set it unconditionally to always reflect the latest run.
export const setAssignmentLastRun = async (
  assignmentLastRun: string,
): Promise<Result<void, MongoDbError>> => {
  try {
    const response = await SettingsModel.findOneAndUpdate(settingsFilter, {
      assignmentLastRun,
    }).lean();
    if (!response) {
      return makeErrorResult(MongoDbError.SETTINGS_NOT_FOUND);
    }
    logger.info(`MongoDB: Assignment last run set: ${assignmentLastRun}`);
    return makeSuccessResult();
  } catch (error) {
    logger.error(
      new Error("MongoDB: Error updating assignment last run", {
        cause: error,
      }),
    );
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

export const getLatestServerStartTime = async (): Promise<
  Result<string, MongoDbError>
> => {
  try {
    const response = await SettingsModel.findOne(settingsFilter).lean();
    if (!response) {
      return makeErrorResult(MongoDbError.SETTINGS_NOT_FOUND);
    }

    const result = SettingsSchemaDb.safeParse(response);
    if (!result.success) {
      logger.error(
        new Error(`Error validating getLatestServerStartTime DB value`, {
          cause: result.error,
        }),
      );
      return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
    }

    return makeSuccessResult(result.data.latestServerStartTime);
  } catch (error) {
    logger.error(
      new Error("MongoDB: Error getting latest server start time", {
        cause: error,
      }),
    );
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};
