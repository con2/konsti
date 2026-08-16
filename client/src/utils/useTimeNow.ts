import dayjs, { Dayjs } from "dayjs";
import { config } from "shared/config";
import { useAppSelector } from "client/utils/hooks";

// The current time, mocked time included. A hook rather than a plain getter on
// purpose: reading the mocked time straight off the store would hide the
// dependency from React, so a component could keep showing a stale time after
// a data poll brought in a new one. Pass the value down to pure helpers
// instead of letting them reach for the store themselves.
//
// The returned value is deliberately not referentially stable - it is the
// current instant. Don't put it in a dependency array; depend on the data
// whose change should trigger the recomputation instead
export const useTimeNow = (): Dayjs => {
  const testTime = useAppSelector((state) => state.testSettings.testTime);

  if (
    config.client().loadedSettings !== "production" &&
    config.client().showTestValues &&
    // Fall back to the real time while no mocked time is set: dayjs("") is an
    // invalid date, which silently makes every time comparison false instead
    // of failing loudly
    testTime
  ) {
    return dayjs(testTime);
  }

  return dayjs();
};
