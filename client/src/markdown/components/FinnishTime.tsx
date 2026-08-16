import { ReactNode } from "react";
import { getDateAndTime } from "shared/utils/timeFormatter";
import { useTimeNow } from "client/utils/useTimeNow";

export const FinnishTime = (): ReactNode => {
  return getDateAndTime(useTimeNow().toISOString());
};
