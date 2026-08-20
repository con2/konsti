import { useMemo, useSyncExternalStore } from "react";
import { config } from "shared/config";
import { getLocaleSnapshot, subscribeToLocale } from "shared/utils/setLocale";
import { getTimeNowSnapshot, subscribeToClock } from "client/utils/clock";
import { useAppSelector } from "client/utils/hooks";

// Real wall-clock time, never the mocked test time. Use this over useTimeNow
// only where the value is compared against something the mock doesn't move
// either, such as a timestamp the server has already written
export const useRealTimeNow = (): Date => {
  const timeNowMs = useSyncExternalStore(subscribeToClock, getTimeNowSnapshot);
  const locale = useSyncExternalStore(subscribeToLocale, getLocaleSnapshot);

  // Tagged with the language it was read under, so the instant gets a new
  // identity when the language changes. Consumers format it with the active
  // locale, which lives in module state React cannot see, so a value that
  // survived a language change would keep rendering the previous language's
  // weekday until the next tick. Rebuilt only on those two events, so it stays
  // referentially stable in between and can be listed as a dependency
  const timeNow = useMemo(
    () => ({ locale, date: new Date(timeNowMs) }),
    [timeNowMs, locale],
  );

  return timeNow.date;
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
