import moment from "moment";
import { config } from "client/config";
import { store } from "client/utils/store";

export const getTime = (): string => {
  if (config.loadedSettings !== "production" && config.showTestValues) {
    const testTime = store.getState().admin.testTime;
    return testTime ?? "";
  }

  return moment().format();
};
