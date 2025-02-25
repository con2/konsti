import { ReactNode } from "react";
import { getTimeNow } from "client/utils/getTimeNow";
import { getDateAndTime } from "client/utils/timeFormatter";

export const FinnishTime = (): ReactNode => {
  return getDateAndTime(getTimeNow().toISOString());
};
