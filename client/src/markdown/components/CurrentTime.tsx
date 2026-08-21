import { ReactNode } from "react";
import { getLocalDateAndTime } from "shared/utils/timeFormatter";
import { useLocale } from "client/utils/useLocale";
import { useTimeNow } from "client/utils/useTimeNow";

export const CurrentTime = (): ReactNode => {
  return getLocalDateAndTime(useTimeNow(), useLocale());
};
