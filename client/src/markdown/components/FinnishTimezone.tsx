import { ReactNode } from "react";
import { useTimeFormatters } from "client/utils/useTimeFormatters";
import { useTimeNow } from "client/utils/useTimeNow";

export const FinnishTimezone = (): ReactNode => {
  const { getTimezone } = useTimeFormatters();
  return getTimezone(useTimeNow().toISOString());
};
