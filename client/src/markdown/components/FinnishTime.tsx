import { ReactNode } from "react";
import { getDateAndTime } from "shared/utils/timeFormatter";
import { useLocale } from "client/utils/useLocale";
import { useTimeNow } from "client/utils/useTimeNow";

export const FinnishTime = (): ReactNode => {
  return getDateAndTime(useTimeNow().toISOString(), useLocale());
};
