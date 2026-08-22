import { ReactNode } from "react";
import { useTimeFormatters } from "client/utils/useTimeFormatters";
import { useTimeNow } from "client/utils/useTimeNow";

export const CurrentTime = (): ReactNode => {
  const { getLocalDateAndTime } = useTimeFormatters();
  return getLocalDateAndTime(useTimeNow());
};
