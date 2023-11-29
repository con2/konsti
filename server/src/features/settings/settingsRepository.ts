import dayjs from "dayjs";
import { logger } from "server/utils/logger";
import { SettingsModel } from "server/features/settings/settingsSchema";
import {
  Settings,
  SettingsSchema,
  SignupQuestion,
} from "shared/typings/models/settings";
import { Game } from "shared/typings/models/game";
import { findGames } from "server/features/game/gameRepository";
import { PostSettingsRequest } from "shared/typings/api/settings";
import { SettingsDoc } from "server/typings/settingsTypes";
import {
  Result,
  isErrorResult,
  unwrapResult,
  makeSuccessResult,
  makeErrorResult,
} from "shared/utils/result";
import { MongoDbError } from "shared/typings/api/errors";

export const removeSettings = async (): Promise<Result<void, MongoDbError>> => {
  logger.info("MongoDB: remove ALL settings from db");
  try {
    await SettingsModel.deleteMany({});
    return makeSuccessResult(undefined);
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
    logger.info(`MongoDB: Default settings saved to DB`);
    return makeSuccessResult(settings);
  } catch (error) {
    logger.error("MongoDB: Add default settings error: %s", error);
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

export const findSettings = async (): Promise<
  Result<Settings, MongoDbError>
> => {
  try {
    const settings = await SettingsModel.findOne(
      {},
      "-signupQuestions._id -_id -__v -createdAt -updatedAt",
    )
      .lean<Settings>()
      .populate("hiddenGames");

    if (!settings) {
      const createSettingsResult = await createSettings();
      if (isErrorResult(createSettingsResult)) {
        return createSettingsResult;
      }
      const defaultSettings = unwrapResult(createSettingsResult);
      return makeSuccessResult(defaultSettings);
    }

    logger.debug(`MongoDB: Settings data found`);

    const settingsWithFormattedDates = {
      ...settings,
      programUpdateLastRun: dayjs(settings.programUpdateLastRun).toISOString(),
      assignmentLastRun: dayjs(settings.assignmentLastRun).toISOString(),
      latestServerStartTime: dayjs(
        settings.latestServerStartTime,
      ).toISOString(),
    };

    const result = SettingsSchema.safeParse(settingsWithFormattedDates);
    if (!result.success) {
      logger.error(
        "%s",
        new Error(`Error validating findSettings response: ${result.error}`),
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
  hiddenGames: readonly Game[],
): Promise<Result<Settings, MongoDbError>> => {
  const gamesResult = await findGames();
  if (isErrorResult(gamesResult)) {
    return gamesResult;
  }

  const games = unwrapResult(gamesResult);
  const formattedData = hiddenGames.reduce<Game[]>((acc, hiddenGame) => {
    const gameDocInDb = games.find((game) => game.gameId === hiddenGame.gameId);
    if (gameDocInDb) {
      acc.push(gameDocInDb._id as Game);
    }
    return acc;
  }, []);

  try {
    const settings = await SettingsModel.findOneAndUpdate(
      {},
      {
        hiddenGames: formattedData,
      },
      {
        new: true,
        upsert: true,
        fields: "-_id -__v -createdAt -updatedAt",
      },
    ).populate("hiddenGames");
    logger.info(`MongoDB: Hidden data updated`);
    return makeSuccessResult(settings);
  } catch (error) {
    logger.error("MongoDB: Error updating hidden games: %s", error);
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

export const saveSignupQuestion = async (
  signupQuestionData: SignupQuestion,
): Promise<Result<Settings, MongoDbError>> => {
  try {
    const settings = await SettingsModel.findOneAndUpdate(
      { "signupQuestions.gameId": { $ne: signupQuestionData.gameId } },
      {
        $addToSet: { signupQuestions: signupQuestionData },
      },
      {
        new: true,
        fields: "-signupQuestions._id -_id -__v -createdAt -updatedAt",
      },
    );
    if (!settings) {
      return makeErrorResult(MongoDbError.SETTINGS_NOT_FOUND);
    }
    logger.info(`MongoDB: Signup question updated`);
    return makeSuccessResult(settings);
  } catch (error) {
    logger.error("MongoDB: Error updating signup info games: %s", error);
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

export const delSignupQuestion = async (
  gameId: string,
): Promise<Result<Settings, MongoDbError>> => {
  try {
    const settings = await SettingsModel.findOneAndUpdate(
      {},
      {
        $pull: { signupQuestions: { gameId } },
      },
      {
        new: true,
        fields: "-signupQuestions._id -_id -__v -createdAt -updatedAt",
      },
    );
    if (!settings) {
      logger.error("%s", new Error("MongoDB: Signup question not found"));
      return makeErrorResult(MongoDbError.SIGNUP_QUESTION_NOT_FOUND);
    }
    logger.info(`MongoDB: Signup info deleted`);
    return makeSuccessResult(settings);
  } catch (error) {
    logger.error("MongoDB: Error deleting signup info games: %s", error);
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

export const saveSettings = async (
  settings: PostSettingsRequest,
): Promise<Result<Settings, MongoDbError>> => {
  try {
    const updatedSettings = await SettingsModel.findOneAndUpdate<SettingsDoc>(
      {},
      settings,
      {
        new: true,
        upsert: true,
        fields: "-createdAt -updatedAt -_id -__v -signupQuestions._id",
      },
    );
    logger.info(`MongoDB: App settings updated`);
    return makeSuccessResult(updatedSettings.toJSON<SettingsDoc>());
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
    );
    if (!response) {
      return makeErrorResult(MongoDbError.SETTINGS_NOT_FOUND);
    }
    logger.info(
      `MongoDB: Program update last run set: ${programUpdateNextRun}`,
    );
    return makeSuccessResult(undefined);
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
    );
    if (!response) {
      return makeErrorResult(MongoDbError.SETTINGS_NOT_FOUND);
    }
    logger.info(`MongoDB: Assignment last run set: ${assignmentNextRun}`);
    return makeSuccessResult(undefined);
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
    });
    if (!response) {
      return makeErrorResult(MongoDbError.SETTINGS_NOT_FOUND);
    }
    logger.info(`MongoDB: Latest server start time found, is latest`);
    return makeSuccessResult(undefined);
  } catch (error) {
    logger.error("MongoDB: Error getting latest server start time: %s", error);
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};
