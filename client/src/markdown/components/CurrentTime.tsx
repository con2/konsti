import { ReactNode } from "react";
import { dateAndTimeFormat } from "shared/utils/timeFormatter";
import { getTimeNow } from "client/utils/getTimeNow";

export const CurrentTime = (): ReactNode => {
  // eslint-disable-next-line no-restricted-syntax -- We want to use local time here
  return getTimeNow().format(dateAndTimeFormat);
};
