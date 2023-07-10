import dayjs, { Dayjs } from "dayjs";
import { config } from "client/config";
import { store } from "client/utils/store";

export const getTimeNow = (): Dayjs => {
  if (config.loadedSettings !== "production" && config.showTestValues) {
    const testTime = store.getState().testSettings.testTime;
    return dayjs(testTime);
  }

  return dayjs();
};
