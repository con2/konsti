import moment from "moment";
import { config } from "client/config";
import { store } from "client/utils/store";
import { sharedConfig } from "shared/config/sharedConfig";

export const getTime = (): string => {
  if (config.loadedSettings !== "production" && config.showTestValues) {
    const testTime = store.getState().testSettings.testTime;
    return testTime ?? "";
  }

  return moment().format();
};

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
