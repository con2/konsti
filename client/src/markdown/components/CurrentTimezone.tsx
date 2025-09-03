import { ReactNode } from "react";
import { getTimeNow } from "client/utils/getTimeNow";
import { timezoneFormat } from "shared/utils/timeFormatter";

export const CurrentTimezone = (): ReactNode => {
  // eslint-disable-next-line no-restricted-syntax -- We want to use local time here
  return getTimeNow().format(timezoneFormat);
};
