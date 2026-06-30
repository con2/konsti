import dayjs from "dayjs";
import { logger } from "server/utils/logger";
import {
  SettingsModel,
  SettingsSchemaDb,
} from "server/features/settings/settingsSchema";
import { Settings, SignupQuestion } from "shared/types/models/settings";
import { PostSettingsRequest } from "shared/types/api/settings";
import {
  Result,
  makeSuccessResult,
  makeErrorResult,
} from "shared/utils/result";
import { MongoDbError } from "shared/types/api/errors";

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
        new Error(
          `Error validating createSettings DB value: ${JSON.stringify(result.error)}`,
        ),
      );
      return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
    }

    logger.info("MongoDB: Default settings saved to DB");

    return makeSuccessResult(result.data);
  } catch (error) {
    logger.error(
      new Error("MongoDB: Add default settings error", { cause: error }),
    );
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

export const findSettings = async (): Promise<
  Result<Settings, MongoDbError>
> => {
  try {
    const settings = await SettingsModel.findOne({}).lean();

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
        new Error(
          `Error validating findSettings DB value: ${JSON.stringify(result.error)}`,
        ),
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
  try {
    const settings = await SettingsModel.findOneAndUpdate(
      {},
      {
        hiddenProgramItemIds,
      },
      {
        returnDocument: "after",
        upsert: true,
      },
    ).lean();

    logger.info("MongoDB: Hidden data updated");

    const result = SettingsSchemaDb.safeParse(settings);
    if (!result.success) {
      logger.error(
        new Error(
          `Error validating saveHidden DB value: ${JSON.stringify(result.error)}`,
        ),
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
        new Error(
          `Error validating saveSignupQuestion DB value: ${JSON.stringify(result.error)}`,
        ),
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
      {},
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
        new Error(
          `Error validating delSignupQuestion DB value: ${JSON.stringify(result.error)}`,
        ),
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
  try {
    const updatedSettings = await SettingsModel.findOneAndUpdate({}, settings, {
      returnDocument: "after",
      upsert: true,
    }).lean();
    logger.info("MongoDB: App settings updated");

    const result = SettingsSchemaDb.safeParse(updatedSettings);
    if (!result.success) {
      logger.error(
        new Error(
          `Error validating saveSettings DB value: ${JSON.stringify(result.error)}`,
        ),
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
        programUpdateLastRun: {
          $lt: dayjs(programUpdateNextRun).subtract(30, "seconds").toDate(),
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
// comfortably longer than any real assignment run so a slow run isn't reclaimed mid-flight
export const ASSIGNMENT_LOCK_STALE_TIMEOUT_MINUTES = 5;

// Acquire the assignment-in-progress lock if it is free or stale. Returns the lock token (the
// acquisition time) to pass to releaseAssignmentLock, or SETTINGS_NOT_FOUND if another run
// currently holds it
export const acquireAssignmentLock = async (): Promise<
  Result<string, MongoDbError>
> => {
  const lockStartTime = dayjs().toISOString();
  try {
    // Acquire if the lock is free (null) or stale (acquired longer ago than the timeout)
    const response = await SettingsModel.findOneAndUpdate(
      {
        $or: [
          { assignmentInProgressStartTime: null },
          {
            assignmentInProgressStartTime: {
              $lt: dayjs(lockStartTime)
                .subtract(ASSIGNMENT_LOCK_STALE_TIMEOUT_MINUTES, "minutes")
                .toDate(),
            },
          },
        ],
      },
      {
        assignmentInProgressStartTime: lockStartTime,
      },
    ).lean();
    if (!response) {
      return makeErrorResult(MongoDbError.SETTINGS_NOT_FOUND);
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
        assignmentInProgressStartTime: dayjs(lockToken).toDate(),
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
// is acquireAssignmentLock — so set it unconditionally to always reflect the latest run
export const setAssignmentLastRun = async (
  assignmentLastRun: string,
): Promise<Result<void, MongoDbError>> => {
  try {
    const response = await SettingsModel.findOneAndUpdate(
      {},
      {
        assignmentLastRun,
      },
    ).lean();
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

export const isLatestStartedServerInstance = async (
  latestServerStartTime: string,
): Promise<Result<void, MongoDbError>> => {
  try {
    const response = await SettingsModel.findOne({
      latestServerStartTime: {
        $eq: dayjs(latestServerStartTime).toISOString(),
      },
    }).lean();
    if (!response) {
      return makeErrorResult(MongoDbError.SETTINGS_NOT_FOUND);
    }
    logger.info("MongoDB: Latest server start time found, is latest");
    return makeSuccessResult();
  } catch (error) {
    logger.error(
      new Error("MongoDB: Error getting latest server start time", {
        cause: error,
      }),
    );
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};
