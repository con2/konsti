import { ReactNode } from "react";
import { getLocalTimezone } from "shared/utils/timeFormatter";
import { useLocale } from "client/utils/useLocale";
import { useTimeNow } from "client/utils/useTimeNow";

export const CurrentTimezone = (): ReactNode => {
  return getLocalTimezone(useTimeNow(), useLocale());
};
