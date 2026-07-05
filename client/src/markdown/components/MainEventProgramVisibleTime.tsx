import { ReactNode } from "react";
import { config } from "shared/config";
import { getDateAndTime } from "shared/utils/timeFormatter";

export const MainEventProgramVisibleTime = (): ReactNode => {
  const { mainEventProgramVisibleTime } = config.event();
  if (!mainEventProgramVisibleTime) {
    return null;
  }
  return getDateAndTime(mainEventProgramVisibleTime);
};
