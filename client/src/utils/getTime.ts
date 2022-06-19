import moment, { Moment } from "moment";
import { config } from "client/config";
import { store } from "client/utils/store";

export const getTime = (): Moment => {
  if (config.loadedSettings !== "production" && config.showTestValues) {
    const testTime = store.getState().testSettings.testTime;
    return moment(testTime);
  }

  return moment();
};
