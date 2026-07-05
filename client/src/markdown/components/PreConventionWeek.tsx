import { ReactNode } from "react";
import { useTimeNow } from "client/utils/getTimeNow";
import { isMainEventProgramVisible } from "client/utils/getUpcomingProgramItems";

interface Props {
  children: ReactNode;
}

// Renders children only while the pre-convention week phase is ongoing, i.e.
// mainEventProgramVisibleTime is configured and hasn't passed yet
export const PreConventionWeek = ({ children }: Props): ReactNode => {
  return isMainEventProgramVisible(useTimeNow()) ? null : children;
};
