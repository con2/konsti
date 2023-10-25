import dayjs, { Dayjs } from "dayjs";
import { config } from "shared/config/config";
import { store } from "client/utils/store";

export const getTimeNow = (): Dayjs => {
  if (
    config.client().loadedSettings !== "production" &&
    config.client().showTestValues
  ) {
    const testTime = store.getState().testSettings.testTime;
    return dayjs(testTime);
  }

  return dayjs();
};
