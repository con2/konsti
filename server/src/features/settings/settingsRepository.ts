import { logger } from "server/utils/logger";
import { SettingsModel } from "server/features/settings/settingsSchema";
import { Settings, SignupQuestion } from "shared/typings/models/settings";
import { Game } from "shared/typings/models/game";
import { findGames } from "server/features/game/gameRepository";
import { PostSettingsRequest } from "shared/typings/api/settings";
import { SettingsDoc } from "server/typings/settings.typings";
import {
  AsyncResult,
  isErrorResult,
  unwrapResult,
  makeSuccessResult,
  makeErrorResult,
} from "shared/utils/asyncResult";
import { MongoDbError } from "shared/typings/api/errors";

export const removeSettings = async (): Promise<
  AsyncResult<void, MongoDbError>
> => {
  logger.info("MongoDB: remove ALL settings from db");
  try {
    await SettingsModel.deleteMany({});
    return makeSuccessResult(undefined);
  } catch (error) {
    logger.error(`MongoDB: Error removing settings: ${error}`);
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

const createSettings = async (): Promise<
  AsyncResult<Settings, MongoDbError>
> => {
  logger.info("MongoDB: Create default settings");
  const defaultSettings = new SettingsModel();
  try {
    const settings = await defaultSettings.save();
    logger.info(`MongoDB: Default settings saved to DB`);
    return makeSuccessResult(settings);
  } catch (error) {
    logger.error(`MongoDB: Add default settings error: ${error}`);
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

export const findSettings = async (): Promise<
  AsyncResult<Settings, MongoDbError>
> => {
  try {
    const settings = await SettingsModel.findOne(
      {},
      "-signupQuestions._id -_id -__v -createdAt -updatedAt"
    )
      .lean<Settings>()
      .populate("hiddenGames");

    if (!settings) {
      const createSettingsAsyncResult = await createSettings();
      if (isErrorResult(createSettingsAsyncResult)) {
        return createSettingsAsyncResult;
      }
      const defaultSettings = unwrapResult(createSettingsAsyncResult);
      return makeSuccessResult(defaultSettings);
    }

    logger.debug(`MongoDB: Settings data found`);
    return makeSuccessResult(settings);
  } catch (error) {
    logger.error(`MongoDB: Error finding settings data: ${error}`);
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

export const saveHidden = async (
  hiddenGames: readonly Game[]
): Promise<AsyncResult<Settings, MongoDbError>> => {
  const gamesAsyncResult = await findGames();
  if (isErrorResult(gamesAsyncResult)) {
    return gamesAsyncResult;
  }

  const games = unwrapResult(gamesAsyncResult);
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
      }
    ).populate("hiddenGames");
    logger.info(`MongoDB: Hidden data updated`);
    return makeSuccessResult(settings);
  } catch (error) {
    logger.error(`MongoDB: Error updating hidden games: ${error}`);
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

export const saveSignupQuestion = async (
  signupQuestionData: SignupQuestion
): Promise<Settings> => {
  let settings;
  try {
    settings = await SettingsModel.findOneAndUpdate(
      {},
      {
        $push: { signupQuestions: signupQuestionData },
      },
      {
        new: true,
        upsert: true,
        fields: "-signupQuestions._id -_id -__v -createdAt -updatedAt",
      }
    );
  } catch (error) {
    throw new Error(`MongoDB: Error updating signup info games: ${error}`);
  }

  logger.info(`MongoDB: Signup question updated`);
  return settings;
};

export const delSignupQuestion = async (gameId: string): Promise<Settings> => {
  let settings;
  try {
    settings = await SettingsModel.findOneAndUpdate(
      {},
      {
        $pull: { signupQuestions: { gameId } },
      },
      {
        new: true,
        fields: "-signupQuestions._id -_id -__v -createdAt -updatedAt",
      }
    );
    if (!settings) {
      throw new Error("Signup question not found");
    }
  } catch (error) {
    throw new Error(`MongoDB: Error deleting signup info games: ${error}`);
  }

  logger.info(`MongoDB: Signup info deleted`);
  return settings;
};

export const saveSettings = async (
  settings: PostSettingsRequest
): Promise<Settings> => {
  let updatedSettings;
  try {
    updatedSettings = await SettingsModel.findOneAndUpdate<SettingsDoc>(
      {},
      settings,
      {
        new: true,
        upsert: true,
        fields: "-createdAt -updatedAt -_id -__v -signupQuestions._id",
      }
    );
  } catch (error) {
    throw new Error(`MongoDB: Error updating app settings: ${error}`);
  }

  logger.info(`MongoDB: App settings updated`);
  return updatedSettings.toJSON<SettingsDoc>();
};
