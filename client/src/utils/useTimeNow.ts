import dayjs, { Dayjs } from "dayjs";
import { useMemo, useSyncExternalStore } from "react";
import { useTranslation } from "react-i18next";
import { config } from "shared/config";
import { getTimeNowSnapshot, subscribeToClock } from "client/utils/clock";
import { useAppSelector } from "client/utils/hooks";

// Real wall-clock time, never the mocked test time. Use this over useTimeNow
// only where the value is compared against something the mock doesn't move
// either, such as a timestamp the server has already written
export const useRealTimeNow = (): Dayjs => {
  const { i18n } = useTranslation();
  const timeNowMs = useSyncExternalStore(subscribeToClock, getTimeNowSnapshot);

  // A Dayjs instance captures the active locale when it is constructed, so it
  // has to be rebuilt on a language change or anything formatted from it keeps
  // coming out in the language it was first read in
  return useMemo(
    () => dayjs(timeNowMs).locale(i18n.language),
    [timeNowMs, i18n.language],
  );
};

// The current time, mocked time included. A hook rather than a plain getter so
// a component re-renders as the clock advances and when a data poll brings in a
// new mocked time. Pass the value down to pure helpers instead of letting them
// reach for the store
export const useTimeNow = (): Dayjs => {
  const { i18n } = useTranslation();
  const testTime = useAppSelector((state) => state.testSettings.testTime);
  const realTimeNow = useRealTimeNow();
  const mockedTimeNow = useMemo(
    () => dayjs(testTime).locale(i18n.language),
    [testTime, i18n.language],
  );

  return config.client().loadedSettings !== "production" &&
    config.client().showTestValues &&
    // Fall back to the real time while no mocked time is set: dayjs("") is an
    // invalid date, which silently makes every time comparison false instead
    // of failing loudly
    testTime
    ? mockedTimeNow
    : realTimeNow;
};
