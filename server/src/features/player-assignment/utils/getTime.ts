import dayjs, { Dayjs } from "dayjs";
import { config } from "server/config";
import { findTestSettings } from "server/test/test-settings/testSettingsRepository";

export const getTime = async (): Promise<Dayjs> => {
  if (process.env.SETTINGS !== "production" && config.useTestTime) {
    const { testTime } = await findTestSettings();
    return dayjs(testTime);
  }

  return dayjs();
};
