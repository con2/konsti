import dayjs, { Dayjs } from "dayjs";
import { clientConfig } from "client/clientConfig";
import { store } from "client/utils/store";

export const getTimeNow = (): Dayjs => {
  if (
    clientConfig.loadedSettings !== "production" &&
    clientConfig.showTestValues
  ) {
    const testTime = store.getState().testSettings.testTime;
    return dayjs(testTime);
  }

  return dayjs();
};
