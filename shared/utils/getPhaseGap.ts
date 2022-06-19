import moment, { Moment } from "moment";
import { sharedConfig } from "shared/config/sharedConfig";

const { DIRECT_SIGNUP_START, PHASE_GAP } = sharedConfig;

export interface PhaseGap {
  waitingForPhaseGapToEnd: boolean;
  phaseGapEndTime: string;
}

interface GetPhaseGapParams {
  startTime: string;
  timeNow: Moment;
}

export const getPhaseGap = ({
  startTime,
  timeNow,
}: GetPhaseGapParams): PhaseGap => {
  const startTimeWithPhaseGap = moment(startTime).add(PHASE_GAP, "minutes");
  const currentTimeWithDirectSignupDuration = timeNow.add(
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
