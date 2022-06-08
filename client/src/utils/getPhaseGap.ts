import moment from "moment";
import { getTime } from "client/utils/getTime";
import { sharedConfig } from "shared/config/sharedConfig";

export interface PhaseGap {
  waitingForPhaseGapToEnd: boolean;
  phaseGapEndTime: string;
}

export const getPhaseGap = (startTime: string): PhaseGap => {
  const startTimeWithPhaseGap = moment(startTime).add(
    sharedConfig.PHASE_GAP,
    "minutes"
  );
  const currentTimeWithDirectSignupDuration = moment(getTime()).add(
    sharedConfig.DIRECT_SIGNUP_START,
    "minutes"
  );
  const waitingForPhaseGapToEnd = startTimeWithPhaseGap.isAfter(
    currentTimeWithDirectSignupDuration
  );

  return {
    waitingForPhaseGapToEnd,
    phaseGapEndTime: startTimeWithPhaseGap.format(),
  };
};
