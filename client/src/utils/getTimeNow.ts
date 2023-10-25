import dayjs, { Dayjs } from "dayjs";
import { getClientConfig } from "client/clientConfig";
import { store } from "client/utils/store";

export const getTimeNow = (): Dayjs => {
  if (
    getClientConfig().loadedSettings !== "production" &&
    getClientConfig().showTestValues
  ) {
    const testTime = store.getState().testSettings.testTime;
    return dayjs(testTime);
  }

  return dayjs();
};
