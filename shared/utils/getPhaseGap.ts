import { Dayjs } from "dayjs";
import { sharedConfig } from "shared/config/sharedConfig";

const { DIRECT_SIGNUP_START, PHASE_GAP } = sharedConfig;

interface PhaseGap {
  waitingForPhaseGapToEnd: boolean;
  phaseGapEndTime: string;
}

interface GetPhaseGapParams {
  startTime: Dayjs;
  timeNow: Dayjs;
}

export const getPhaseGap = ({
  startTime,
  timeNow,
}: GetPhaseGapParams): PhaseGap => {
  const startTimeWithPhaseGap = startTime.add(PHASE_GAP, "minutes");
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
