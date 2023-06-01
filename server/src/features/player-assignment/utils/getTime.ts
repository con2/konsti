import dayjs, { Dayjs } from "dayjs";
import { config } from "server/config";
import { findTestSettings } from "server/test/test-settings/testSettingsRepository";
import { MongoDbError } from "shared/typings/api/errors";
import {
  AsyncResult,
  isErrorResult,
  makeSuccessResult,
  unwrapResult,
} from "shared/utils/asyncResult";

export const getTime = async (): Promise<AsyncResult<Dayjs, MongoDbError>> => {
  if (process.env.SETTINGS !== "production" && config.useTestTime) {
    const findTestSettingsAsyncResult = await findTestSettings();
    if (isErrorResult(findTestSettingsAsyncResult)) {
      return findTestSettingsAsyncResult;
    }
    const testSettings = unwrapResult(findTestSettingsAsyncResult);
    return makeSuccessResult(dayjs(testSettings.testTime));
  }

  return makeSuccessResult(dayjs());
};
