import dayjs, { Dayjs } from "dayjs";
import { config } from "shared/config";
import { useAppSelector } from "client/utils/hooks";
import { store } from "client/utils/store";

export const getTimeNow = (): Dayjs => {
  if (
    config.client().loadedSettings !== "production" &&
    config.client().showTestValues
  ) {
    const testTime = store.getState().testSettings.testTime;
    // Fall back to the real time while no mocked time is set: dayjs("") is an
    // invalid date, which silently makes every time comparison false instead
    // of failing loudly
    if (testTime) {
      return dayjs(testTime);
    }
  }

  return dayjs();
};

// Reactive getTimeNow: re-renders the component when the mocked test time changes
export const useTimeNow = (): Dayjs => {
  useAppSelector((state) => state.testSettings.testTime);
  return getTimeNow();
};
