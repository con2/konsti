import moment from "moment";
import { getTime } from "server/features/player-assignment/utils/getTime";
import { sharedConfig } from "shared/config/sharedConfig";

interface PhaseGap {
  waitingForPhaseGapToEnd: boolean;
  phaseGapEndTime: string;
}

export const getPhaseGap = async (startTime: string): Promise<PhaseGap> => {
  const startTimeWithPhaseGap = moment(startTime).add(
    sharedConfig.PHASE_GAP,
    "minutes"
  );
  const currentTimeWithDirectSignupDuration = moment(await getTime()).add(
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
