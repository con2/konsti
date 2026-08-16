import { ReactNode } from "react";
import { timezoneFormat } from "shared/utils/timeFormatter";
import { useTimeNow } from "client/utils/useTimeNow";

export const CurrentTimezone = (): ReactNode => {
  // eslint-disable-next-line no-restricted-syntax -- We want to use local time here
  return useTimeNow().format(timezoneFormat);
};
