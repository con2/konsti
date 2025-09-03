import { ReactNode } from "react";
import { getTimeNow } from "client/utils/getTimeNow";
import { getDateAndTime } from "shared/utils/timeFormatter";

export const FinnishTime = (): ReactNode => {
  return getDateAndTime(getTimeNow().toISOString());
};
