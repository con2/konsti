import { logger } from "server/utils/logger";
import { SettingsModel } from "server/features/settings/settingsSchema";
import { GameDoc } from "server/typings/game.typings";
import { Settings, SignupMessage } from "shared/typings/models/settings";
import { Game } from "shared/typings/models/game";
import { findGames } from "server/features/game/gameRepository";
import { PostSettingsRequest } from "shared/typings/api/settings";
import { SettingsDoc } from "server/typings/settings.typings";

export const removeSettings = async (): Promise<void> => {
  logger.info("MongoDB: remove ALL settings from db");
  try {
    await SettingsModel.deleteMany({});
  } catch (error) {
    throw new Error(`MongoDB: Error removing settings: ${error}`);
  }
};

const createSettings = async (): Promise<Settings> => {
  logger.info("MongoDB: Create default settings");

  const defaultSettings = new SettingsModel();

  let settings;
  try {
    settings = await defaultSettings.save();
  } catch (error) {
    throw new Error(`MongoDB: Add default settings error: ${error}`);
  }

  logger.info(`MongoDB: Default settings saved to DB`);
  return settings;
};

export const findSettings = async (): Promise<Settings> => {
  let settings;
  try {
    settings = await SettingsModel.findOne(
      {},
      "-signupMessages._id -_id -__v -createdAt -updatedAt"
    )
      .lean<Settings>()
      .populate("hiddenGames");
  } catch (error) {
    throw new Error(`MongoDB: Error finding settings data: ${error}`);
  }

  if (!settings) return await createSettings();

  logger.debug(`MongoDB: Settings data found`);
  return settings;
};

export const saveHidden = async (
  hiddenGames: readonly Game[]
): Promise<Settings> => {
  let games: GameDoc[];
  try {
    games = await findGames();
  } catch (error) {
    logger.error(`MongoDB: Error loading games - ${error}`);
    throw error;
  }

  const formattedData = hiddenGames.reduce<Game[]>((acc, hiddenGame) => {
    const gameDocInDb = games.find((game) => game.gameId === hiddenGame.gameId);
    if (gameDocInDb) {
      acc.push(gameDocInDb._id as Game);
    }
    return acc;
  }, []);

  let settings;
  try {
    settings = await SettingsModel.findOneAndUpdate(
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
  } catch (error) {
    throw new Error(`MongoDB: Error updating hidden games: ${error}`);
  }

  logger.info(`MongoDB: Hidden data updated`);
  return settings;
};

export const saveSignupMessage = async (
  signupMessageData: SignupMessage
): Promise<Settings> => {
  let settings;
  try {
    settings = await SettingsModel.findOneAndUpdate(
      {},
      {
        $push: { signupMessages: signupMessageData },
      },
      {
        new: true,
        upsert: true,
        fields: "-signupMessages._id -_id -__v -createdAt -updatedAt",
      }
    );
  } catch (error) {
    throw new Error(`MongoDB: Error updating signup info games: ${error}`);
  }

  logger.info(`MongoDB: Signup message updated`);
  return settings;
};

export const delSignupMessage = async (gameId: string): Promise<Settings> => {
  let settings;
  try {
    settings = await SettingsModel.findOneAndUpdate(
      {},
      {
        $pull: { signupMessages: { gameId } },
      },
      {
        new: true,
        fields: "-signupMessages._id -_id -__v -createdAt -updatedAt",
      }
    );
    if (!settings) {
      throw new Error("Signup messages not found");
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
        fields: "-createdAt -updatedAt -_id -__v -signupMessages._id",
      }
    );
  } catch (error) {
    throw new Error(`MongoDB: Error updating app settings: ${error}`);
  }

  logger.info(`MongoDB: App settings updated`);
  return updatedSettings.toJSON<SettingsDoc>();
};
