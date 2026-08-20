import { useMemo, useSyncExternalStore } from "react";
import { config } from "shared/config";
import { getTimeNowSnapshot, subscribeToClock } from "client/utils/clock";
import { useAppSelector } from "client/utils/hooks";

// Real wall-clock time, never the mocked test time. Use this over useTimeNow
// only where the value is compared against something the mock doesn't move
// either, such as a timestamp the server has already written
export const useRealTimeNow = (): Date => {
  const timeNowMs = useSyncExternalStore(subscribeToClock, getTimeNowSnapshot);

  // Rebuilt only on a tick, so the value stays referentially stable in between
  // and can be listed as a dependency like anything else
  return useMemo(() => new Date(timeNowMs), [timeNowMs]);
};

// Whether the mocked test time replaces the real clock. Exported so the rule can
// be tested without rendering: the whole app's sense of time depends on it
export const shouldUseTestTime = (testTime: string | null): boolean =>
  config.client().loadedSettings !== "production" &&
  config.client().showTestValues &&
  testTime !== null &&
  testTime !== "";

// The current time, mocked time included. A hook rather than a plain getter so
// a component re-renders as the clock advances and when a data poll brings in a
// new mocked time. Pass the value down to pure helpers instead of letting them
// reach for the store
export const useTimeNow = (): Date => {
  const testTime = useAppSelector((state) => state.testSettings.testTime);
  const realTimeNow = useRealTimeNow();

  // An unset mocked time parses to an invalid date, which the guard below keeps
  // from ever being returned
  const mockedTimeNow = useMemo(() => new Date(testTime ?? ""), [testTime]);

  return shouldUseTestTime(testTime) ? mockedTimeNow : realTimeNow;
};
