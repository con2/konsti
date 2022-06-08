import moment from "moment";
import { config } from "server/config";
import { findTestSettings } from "server/test/test-settings/testSettingsRepository";

export const getTime = async (): Promise<string> => {
  if (process.env.SETTINGS !== "production" && config.useTestTime) {
    const { testTime } = await findTestSettings();
    return testTime;
  }

  return moment().format();
};
