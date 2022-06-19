import moment, { Moment } from "moment";
import { config } from "server/config";
import { findTestSettings } from "server/test/test-settings/testSettingsRepository";

export const getTime = async (): Promise<Moment> => {
  if (process.env.SETTINGS !== "production" && config.useTestTime) {
    const { testTime } = await findTestSettings();
    return moment(testTime);
  }

  return moment();
};
