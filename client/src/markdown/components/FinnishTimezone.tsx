import { ReactElement } from "react";
import { getTimeNow } from "client/utils/getTimeNow";
import { getTimezone } from "client/utils/timeFormatter";

// eslint-disable-next-line import/no-unused-modules
export const FinnishTimezone = (): ReactElement => {
  return <span>{getTimezone(getTimeNow().toISOString())}</span>;
};
