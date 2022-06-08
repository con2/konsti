import moment from "moment";
import { getTime } from "client/utils/getTime";
import { sharedConfig } from "shared/config/sharedConfig";

const { DIRECT_SIGNUP_START, PHASE_GAP } = sharedConfig;

export interface PhaseGap {
  waitingForPhaseGapToEnd: boolean;
  phaseGapEndTime: string;
}

export const getPhaseGap = (startTime: string): PhaseGap => {
  const startTimeWithPhaseGap = moment(startTime).add(PHASE_GAP, "minutes");
  const currentTimeWithDirectSignupDuration = moment(getTime()).add(
    DIRECT_SIGNUP_START,
    "minutes"
  );
  const waitingForPhaseGapToEnd = startTimeWithPhaseGap.isAfter(
    currentTimeWithDirectSignupDuration
  );

  const phaseGapEndTime = startTimeWithPhaseGap
    .subtract(DIRECT_SIGNUP_START, "minutes")
    .format();

  return {
    waitingForPhaseGapToEnd,
    phaseGapEndTime,
  };
};
