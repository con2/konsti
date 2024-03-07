import { ReactElement } from "react";
import { getTimeNow } from "client/utils/getTimeNow";
import { getDateAndTime } from "client/utils/timeFormatter";

// eslint-disable-next-line import/no-unused-modules
export const FinnishTime = (): ReactElement => {
  return <span>{getDateAndTime(getTimeNow().toISOString())}</span>;
};
