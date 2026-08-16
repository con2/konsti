import { ReactNode } from "react";
import { isMainEventProgramVisible } from "client/utils/getUpcomingProgramItems";
import { useTimeNow } from "client/utils/useTimeNow";

interface Props {
  children: ReactNode;
}

// Renders children only while the pre-convention week phase is ongoing, i.e.
// mainEventProgramVisibleTime is configured and hasn't passed yet
export const PreConventionWeek = ({ children }: Props): ReactNode => {
  return isMainEventProgramVisible(useTimeNow()) ? null : children;
};
