import { logger } from "server/utils/logger";
import { TestSettings } from "shared/test-typings/models/testSettings";
import { TestSettingsModel } from "server/test/test-settings/testSettingsSchema";
import { PostTestSettingsRequest } from "shared/test-typings/api/testSettings";

export const removeTestSettings = async (): Promise<void> => {
  logger.info("MongoDB: remove ALL test settings from db");
  try {
    await TestSettingsModel.deleteMany({});
  } catch (error) {
    throw new Error(`MongoDB: Error removing test settings: ${error}`);
  }
};

const createTestSettings = async (): Promise<TestSettings> => {
  logger.info("MongoDB: Create default test settings");

  const defaultSettings = new TestSettingsModel();

  let testSettings;
  try {
    testSettings = await defaultSettings.save();
  } catch (error) {
    throw new Error(`MongoDB: Add default test settings error: ${error}`);
  }

  logger.info(`MongoDB: Default test settings saved to DB`);
  return testSettings;
};

export const findTestSettings = async (): Promise<TestSettings> => {
  let testSettings;
  try {
    testSettings = await TestSettingsModel.findOne(
      {},
      "-signupMessages._id -_id -__v -createdAt -updatedAt"
    ).lean<TestSettings>();
  } catch (error) {
    throw new Error(`MongoDB: Error finding test settings data: ${error}`);
  }

  if (!testSettings) return await createTestSettings();

  logger.debug(`MongoDB: Test settings data found`);
  return testSettings;
};

export const saveTestSettings = async (
  settings: PostTestSettingsRequest
): Promise<TestSettings> => {
  let updatedTestSettings;
  try {
    updatedTestSettings = await TestSettingsModel.findOneAndUpdate(
      {},
      settings,
      {
        new: true,
        upsert: true,
        fields: "-createdAt -updatedAt",
      }
    );
  } catch (error) {
    throw new Error(`MongoDB: Error updating test settings: ${error}`);
  }

  logger.info(`MongoDB: Test settings updated`);
  return updatedTestSettings.toJSON();
};
