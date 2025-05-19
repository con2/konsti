import { logger } from "server/utils/logger";
import { TestSettings } from "shared/test-types/models/testSettings";
import { TestSettingsModel } from "server/test/test-settings/testSettingsSchema";
import { PostTestSettingsRequest } from "shared/test-types/api/testSettings";
import {
  Result,
  isErrorResult,
  makeErrorResult,
  makeSuccessResult,
  unwrapResult,
} from "shared/utils/result";
import { MongoDbError } from "shared/types/api/errors";

export const removeTestSettings = async (): Promise<
  Result<void, MongoDbError>
> => {
  logger.info("MongoDB: remove ALL test settings from db");
  try {
    await TestSettingsModel.deleteMany({});
    return makeSuccessResult();
  } catch (error) {
    logger.error("MongoDB: Error removing test settings: %s", error);
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

const createTestSettings = async (): Promise<
  Result<TestSettings, MongoDbError>
> => {
  logger.info("MongoDB: Create default test settings");
  const defaultSettings = new TestSettingsModel();

  try {
    const testSettings = await defaultSettings.save();
    logger.info("MongoDB: Default test settings saved to DB");
    return makeSuccessResult(testSettings);
  } catch (error) {
    logger.error("MongoDB: Add default test settings error: %s", error);
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

export const findTestSettings = async (): Promise<
  Result<TestSettings, MongoDbError>
> => {
  try {
    const testSettings = await TestSettingsModel.findOne(
      {},
      "-_id -__v -createdAt -updatedAt",
    ).lean<TestSettings>();
    if (!testSettings) {
      const createTestSettingsResult = await createTestSettings();
      if (isErrorResult(createTestSettingsResult)) {
        return createTestSettingsResult;
      }
      const defaultTestSettings = unwrapResult(createTestSettingsResult);
      return makeSuccessResult(defaultTestSettings);
    }
    logger.debug("MongoDB: Test settings data found");
    return makeSuccessResult(testSettings);
  } catch (error) {
    logger.error("MongoDB: Error finding test settings data: %s", error);
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

export const saveTestSettings = async (
  settings: PostTestSettingsRequest,
): Promise<Result<TestSettings, MongoDbError>> => {
  try {
    const updatedTestSettings = await TestSettingsModel.findOneAndUpdate(
      {},
      settings,
      {
        new: true,
        upsert: true,
        fields: "-createdAt -updatedAt",
      },
    ).lean<TestSettings>();
    logger.info("MongoDB: Test settings updated");
    return makeSuccessResult(updatedTestSettings);
  } catch (error) {
    logger.error("MongoDB: Error updating test settings: %s", error);
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};
