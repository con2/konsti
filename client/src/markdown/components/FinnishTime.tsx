import { ReactNode } from "react";
import { getDateAndTime } from "shared/utils/timeFormatter";
import { getTimeNow } from "client/utils/getTimeNow";

export const FinnishTime = (): ReactNode => {
  return getDateAndTime(getTimeNow().toISOString());
};
