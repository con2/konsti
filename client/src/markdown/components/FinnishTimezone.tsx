import { ReactNode } from "react";
import { getTimeNow } from "client/utils/getTimeNow";
import { getTimezone } from "client/utils/timeFormatter";

export const FinnishTimezone = (): ReactNode => {
  return getTimezone(getTimeNow().toISOString());
};
