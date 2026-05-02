import dayjs, { Dayjs } from "dayjs";
import { config } from "shared/config";
import { findTestSettings } from "server/test/test-settings/testSettingsRepository";
import { MongoDbError } from "shared/types/api/errors";
import { Result, makeSuccessResult } from "shared/utils/result";

export const getTimeNow = async (): Promise<Result<Dayjs, MongoDbError>> => {
  if (process.env.SETTINGS !== "production" && config.server().useTestTime) {
    const findTestSettingsResult = await findTestSettings();
    if (!findTestSettingsResult.ok) {
      return findTestSettingsResult;
    }
    return makeSuccessResult(
      dayjs(findTestSettingsResult.value.testTime ?? dayjs()),
    );
  }

  return makeSuccessResult(dayjs());
};
