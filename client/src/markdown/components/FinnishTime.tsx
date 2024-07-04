import { ReactNode } from "react";
import { getTimeNow } from "client/utils/getTimeNow";
import { getDateAndTime } from "client/utils/timeFormatter";

// eslint-disable-next-line import/no-unused-modules
export const FinnishTime = (): ReactNode => {
  return getDateAndTime(getTimeNow().toISOString());
};
