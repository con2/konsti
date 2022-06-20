import _ from "lodash";
import { Moment } from "moment";
import { sharedConfig } from "shared/config/sharedConfig";

const { DIRECT_SIGNUP_START, PHASE_GAP } = sharedConfig;

export interface PhaseGap {
  waitingForPhaseGapToEnd: boolean;
  phaseGapEndTime: string;
}

interface GetPhaseGapParams {
  startTime: Moment;
  timeNow: Moment;
}

export const getPhaseGap = ({
  startTime,
  timeNow,
}: GetPhaseGapParams): PhaseGap => {
  // Parameter values are mutated otherwise
  const startTimeCopy = _.cloneDeep(startTime);
  const timeNowCopy = _.cloneDeep(timeNow);

  const startTimeWithPhaseGap = startTimeCopy.add(PHASE_GAP, "minutes");
  const currentTimeWithDirectSignupDuration = timeNowCopy.add(
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
