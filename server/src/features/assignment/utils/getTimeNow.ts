import { config } from "shared/config";
import { MongoDbError } from "shared/types/api/errors";
import { Result, makeSuccessResult } from "shared/utils/result";
import { findTestSettings } from "server/test/test-settings/testSettingsRepository";

export const getTimeNow = async (): Promise<Result<Date, MongoDbError>> => {
  if (process.env.SETTINGS !== "production" && config.server().useTestTime) {
    const findTestSettingsResult = await findTestSettings();
    if (!findTestSettingsResult.ok) {
      return findTestSettingsResult;
    }
    const { testTime } = findTestSettingsResult.value;
    // An unset mocked time means the real clock, not an unparseable date
    return makeSuccessResult(testTime ? new Date(testTime) : new Date());
  }

  return makeSuccessResult(new Date());
};
