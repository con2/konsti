import { ReactElement } from "react";
import { getTimeNow } from "client/utils/getTimeNow";
import { timezoneFormat } from "client/utils/timeFormatter";

// eslint-disable-next-line import/no-unused-modules
export const CurrentTimezone = (): ReactElement => {
  // eslint-disable-next-line no-restricted-syntax -- We want to use local time here
  return <span>GMT {getTimeNow().format(timezoneFormat)}</span>;
};
