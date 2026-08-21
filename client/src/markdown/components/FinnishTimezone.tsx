import { ReactNode } from "react";
import { getTimezone } from "shared/utils/timeFormatter";
import { useLocale } from "client/utils/useLocale";
import { useTimeNow } from "client/utils/useTimeNow";

export const FinnishTimezone = (): ReactNode => {
  return getTimezone(useTimeNow().toISOString(), useLocale());
};
