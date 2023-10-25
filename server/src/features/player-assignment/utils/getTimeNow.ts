import dayjs, { Dayjs } from "dayjs";
import { config } from "server/serverConfig";
import { findTestSettings } from "server/test/test-settings/testSettingsRepository";
import { MongoDbError } from "shared/typings/api/errors";
import {
  Result,
  isErrorResult,
  makeSuccessResult,
  unwrapResult,
} from "shared/utils/result";

export const getTimeNow = async (): Promise<Result<Dayjs, MongoDbError>> => {
  if (process.env.SETTINGS !== "production" && config.useTestTime) {
    const findTestSettingsResult = await findTestSettings();
    if (isErrorResult(findTestSettingsResult)) {
      return findTestSettingsResult;
    }
    const testSettings = unwrapResult(findTestSettingsResult);
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    return makeSuccessResult(dayjs(testSettings.testTime ?? dayjs()));
  }

  return makeSuccessResult(dayjs());
};
