import { ReactNode } from "react";
import { config } from "shared/config";
import { getDateAndTime } from "shared/utils/timeFormatter";
import { useLocale } from "client/utils/useLocale";

export const MainEventProgramVisibleTime = (): ReactNode => {
  const locale = useLocale();
  const { mainEventProgramVisibleTime } = config.event();
  if (!mainEventProgramVisibleTime) {
    return null;
  }
  return getDateAndTime(mainEventProgramVisibleTime, locale);
};
