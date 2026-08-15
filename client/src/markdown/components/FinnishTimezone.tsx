import { ReactNode } from "react";
import { getTimezone } from "shared/utils/timeFormatter";
import { getTimeNow } from "client/utils/getTimeNow";

export const FinnishTimezone = (): ReactNode => {
  return getTimezone(getTimeNow().toISOString());
};
