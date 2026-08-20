import { ReactNode } from "react";
import { getLocalDateAndTime } from "shared/utils/timeFormatter";
import { useTimeNow } from "client/utils/useTimeNow";

export const CurrentTime = (): ReactNode => {
  return getLocalDateAndTime(useTimeNow());
};
