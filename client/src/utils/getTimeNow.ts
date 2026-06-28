import dayjs, { Dayjs } from "dayjs";
import { config } from "shared/config";
import { store } from "client/utils/store";
import { useAppSelector } from "client/utils/hooks";

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

// Reactive getTimeNow: re-renders the component when the mocked test time changes
export const useTimeNow = (): Dayjs => {
  useAppSelector((state) => state.testSettings.testTime);
  return getTimeNow();
};
