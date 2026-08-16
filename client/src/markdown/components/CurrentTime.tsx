import { ReactNode } from "react";
import { dateAndTimeFormat } from "shared/utils/timeFormatter";
import { useTimeNow } from "client/utils/useTimeNow";

export const CurrentTime = (): ReactNode => {
  // eslint-disable-next-line no-restricted-syntax -- We want to use local time here
  return useTimeNow().format(dateAndTimeFormat);
};
