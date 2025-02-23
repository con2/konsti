import { ReactNode } from "react";
import { getTimeNow } from "client/utils/getTimeNow";
import { getTimezone } from "client/utils/timeFormatter";

// eslint-disable-next-line import/no-unused-modules
export const FinnishTimezone = (): ReactNode => {
  return getTimezone(getTimeNow().toISOString());
};
