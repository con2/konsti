import dayjs, { Dayjs } from "dayjs";
import { config } from "server/config";
import { findTestSettings } from "server/test/test-settings/testSettingsRepository";
import { MongoDbError } from "shared/typings/api/errors";
import {
  Result,
  isErrorResult,
  makeSuccessResult,
  unwrapResult,
} from "shared/utils/result";

export const getTime = async (): Promise<Result<Dayjs, MongoDbError>> => {
  if (process.env.SETTINGS !== "production" && config.useTestTime) {
    const findTestSettingsResult = await findTestSettings();
    if (isErrorResult(findTestSettingsResult)) {
      return findTestSettingsResult;
    }
    const testSettings = unwrapResult(findTestSettingsResult);
    return makeSuccessResult(dayjs(testSettings.testTime));
  }

  return makeSuccessResult(dayjs());
};
