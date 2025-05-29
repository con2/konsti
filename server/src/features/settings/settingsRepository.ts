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
  isErrorResult,
  unwrapResult,
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
    logger.error("MongoDB: Error removing settings: %s", error);
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
        "%s",
        new Error(
          `Error validating createSettings DB value: ${JSON.stringify(result.error)}`,
        ),
      );
      return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
    }

    logger.info("MongoDB: Default settings saved to DB");

    return makeSuccessResult(result.data);
  } catch (error) {
    logger.error("MongoDB: Add default settings error: %s", error);
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
      if (isErrorResult(createSettingsResult)) {
        return createSettingsResult;
      }
      const defaultSettings = unwrapResult(createSettingsResult);
      return makeSuccessResult(defaultSettings);
    }

    logger.debug("MongoDB: Settings data found");

    const result = SettingsSchemaDb.safeParse(settings);
    if (!result.success) {
      logger.error(
        "%s",
        new Error(
          `Error validating findSettings DB value: ${JSON.stringify(result.error)}`,
        ),
      );
      return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
    }

    return makeSuccessResult(result.data);
  } catch (error) {
    logger.error("MongoDB: Error finding settings data: %s", error);
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
        new: true,
        upsert: true,
      },
    ).lean();

    logger.info("MongoDB: Hidden data updated");

    const result = SettingsSchemaDb.safeParse(settings);
    if (!result.success) {
      logger.error(
        "%s",
        new Error(
          `Error validating saveHidden DB value: ${JSON.stringify(result.error)}`,
        ),
      );
      return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
    }

    return makeSuccessResult(result.data);
  } catch (error) {
    logger.error("MongoDB: Error updating hidden program items: %s", error);
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
        new: true,
      },
    ).lean();
    if (!settings) {
      return makeErrorResult(MongoDbError.SETTINGS_NOT_FOUND);
    }
    logger.info("MongoDB: Signup question updated");

    const result = SettingsSchemaDb.safeParse(settings);
    if (!result.success) {
      logger.error(
        "%s",
        new Error(
          `Error validating saveSignupQuestion DB value: ${JSON.stringify(result.error)}`,
        ),
      );
      return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
    }

    return makeSuccessResult(result.data);
  } catch (error) {
    logger.error(
      "MongoDB: Error updating program item signup question: %s",
      error,
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
        new: true,
      },
    ).lean();
    if (!settings) {
      logger.error("%s", new Error("MongoDB: Signup question not found"));
      return makeErrorResult(MongoDbError.SIGNUP_QUESTION_NOT_FOUND);
    }
    logger.info("MongoDB: Signup info deleted");

    const result = SettingsSchemaDb.safeParse(settings);
    if (!result.success) {
      logger.error(
        "%s",
        new Error(
          `Error validating delSignupQuestion DB value: ${JSON.stringify(result.error)}`,
        ),
      );
      return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
    }

    return makeSuccessResult(result.data);
  } catch (error) {
    logger.error(
      "MongoDB: Error deleting program item signup question: %s",
      error,
    );
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

export const saveSettings = async (
  settings: PostSettingsRequest,
): Promise<Result<Settings, MongoDbError>> => {
  try {
    const updatedSettings = await SettingsModel.findOneAndUpdate({}, settings, {
      new: true,
      upsert: true,
    }).lean();
    logger.info("MongoDB: App settings updated");

    const result = SettingsSchemaDb.safeParse(updatedSettings);
    if (!result.success) {
      logger.error(
        "%s",
        new Error(
          `Error validating saveSettings DB value: ${JSON.stringify(result.error)}`,
        ),
      );
      return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
    }

    return makeSuccessResult(result.data);
  } catch (error) {
    logger.error("MongoDB: Error updating app settings: %s", error);
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
          $lt: dayjs(programUpdateNextRun).subtract(30, "seconds"),
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
    logger.error("MongoDB: Error updating program update last run: %s", error);
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

export const setAssignmentLastRun = async (
  assignmentNextRun: string,
): Promise<Result<void, MongoDbError>> => {
  try {
    const response = await SettingsModel.findOneAndUpdate(
      {
        assignmentLastRun: {
          $lt: dayjs(assignmentNextRun).subtract(30, "seconds"),
        },
      },
      {
        assignmentLastRun: assignmentNextRun,
      },
    ).lean();
    if (!response) {
      return makeErrorResult(MongoDbError.SETTINGS_NOT_FOUND);
    }
    logger.info(`MongoDB: Assignment last run set: ${assignmentNextRun}`);
    return makeSuccessResult();
  } catch (error) {
    logger.error("MongoDB: Error updating assignment last run: %s", error);
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
    logger.error("MongoDB: Error getting latest server start time: %s", error);
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};
