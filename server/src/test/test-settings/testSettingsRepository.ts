import { PostTestSettingsRequest } from "shared/test-types/api/testSettings";
import { TestSettings } from "shared/test-types/models/testSettings";
import { MongoDbError } from "shared/types/api/errors";
import {
  Result,
  makeErrorResult,
  makeSuccessResult,
} from "shared/utils/result";
import {
  TEST_SETTINGS_SINGLETON_KEY,
  TestSettingsModel,
  TestSettingsSchemaDb,
} from "server/test/test-settings/testSettingsSchema";
import { logger } from "server/utils/logger";

const testSettingsFilter = { singleton: TEST_SETTINGS_SINGLETON_KEY };

export const removeTestSettings = async (): Promise<
  Result<void, MongoDbError>
> => {
  logger.info("MongoDB: remove ALL test settings from db");
  try {
    await TestSettingsModel.deleteMany({});
    return makeSuccessResult();
  } catch (error) {
    logger.error(
      new Error("MongoDB: Error removing test settings", { cause: error }),
    );
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

export const findTestSettings = async (): Promise<
  Result<TestSettings, MongoDbError>
> => {
  try {
    const testSettings =
      await TestSettingsModel.findOne(testSettingsFilter).lean();
    // Reading must not write: a document inserted here races with the upsert
    // in saveTestSettings, and if both see an empty collection they insert
    // separate documents. Reads then return whichever landed first, which can
    // permanently shadow a stored test time behind an empty default
    if (!testSettings) {
      logger.debug("MongoDB: No test settings data, using defaults");
      return makeSuccessResult({ testTime: null });
    }
    logger.debug("MongoDB: Test settings data found");

    const result = TestSettingsSchemaDb.safeParse(testSettings);
    if (!result.success) {
      logger.error(
        new Error(`Error validating findTestSettings DB value`, {
          cause: result.error,
        }),
      );
      return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
    }

    return makeSuccessResult(result.data);
  } catch (error) {
    logger.error(
      new Error("MongoDB: Error finding test settings data", { cause: error }),
    );
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

export const saveTestSettings = async (
  settings: PostTestSettingsRequest,
): Promise<Result<TestSettings, MongoDbError>> => {
  try {
    const updatedTestSettings = await TestSettingsModel.findOneAndUpdate(
      testSettingsFilter,
      settings,
      {
        returnDocument: "after",
        upsert: true,
      },
    ).lean();
    logger.info("MongoDB: Test settings updated");

    const result = TestSettingsSchemaDb.safeParse(updatedTestSettings);
    if (!result.success) {
      logger.error(
        new Error(`Error validating saveTestSettings DB value`, {
          cause: result.error,
        }),
      );
      return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
    }

    return makeSuccessResult(result.data);
  } catch (error) {
    logger.error(
      new Error("MongoDB: Error updating test settings", { cause: error }),
    );
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};
