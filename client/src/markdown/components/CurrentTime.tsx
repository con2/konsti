import { ReactNode } from "react";
import { getTimeNow } from "client/utils/getTimeNow";
import { dateAndTimeFormat } from "client/utils/timeFormatter";

export const CurrentTime = (): ReactNode => {
  // eslint-disable-next-line no-restricted-syntax -- We want to use local time here
  return getTimeNow().format(dateAndTimeFormat);
};
