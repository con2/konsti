import { ReactNode } from "react";
import { getLocalTimezone } from "shared/utils/timeFormatter";
import { useTimeNow } from "client/utils/useTimeNow";

export const CurrentTimezone = (): ReactNode => {
  return getLocalTimezone(useTimeNow());
};
