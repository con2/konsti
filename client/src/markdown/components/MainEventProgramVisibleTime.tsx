import { ReactNode } from "react";
import { config } from "shared/config";
import { useTimeFormatters } from "client/utils/useTimeFormatters";

export const MainEventProgramVisibleTime = (): ReactNode => {
  const { getDateAndTime } = useTimeFormatters();
  const { mainEventProgramVisibleTime } = config.event();
  if (!mainEventProgramVisibleTime) {
    return null;
  }
  return getDateAndTime(mainEventProgramVisibleTime);
};
