import dayjs, { Dayjs } from "dayjs";
import { sharedConfig } from "shared/config/sharedConfig";
import { Game, ProgramType } from "shared/typings/models/game";
import { getPhaseGap } from "shared/utils/getPhaseGap";

const { PRE_SIGNUP_START, DIRECT_SIGNUP_START } = sharedConfig;

export const getAlgorithmSignupStartTime = (startTime: string): Dayjs => {
  const unmodifiedStartTime = dayjs(startTime).subtract(
    PRE_SIGNUP_START,
    "minutes"
  );

  const startTimeIsTooEarly = unmodifiedStartTime.hour() <= 6;

  if (startTimeIsTooEarly) {
    return unmodifiedStartTime.subtract(1, "day").hour(22);
  }
  return unmodifiedStartTime;
};

export const getAlgorithmSignupEndTime = (startTime: string): Dayjs => {
  return dayjs(startTime).subtract(DIRECT_SIGNUP_START, "minutes");
};

export const getDirectSignupStartTime = (
  game: Game,
  timeNow: Dayjs
): string | null => {
  const signupAlwaysOpen = sharedConfig.directSignupAlwaysOpenIds.includes(
    game.gameId
  );

  if (signupAlwaysOpen) {
    return null;
  }

  const signupWindowsForProgramType =
    sharedConfig.directSignupWindows[game.programType];

  const matchingSignupWindow = signupWindowsForProgramType.find(
    (signupWindow) =>
      dayjs(game.startTime).isBetween(
        signupWindow.signupWindowStart,
        signupWindow.signupWindowClose,
        "minutes",
        "[]"
      )
  );

  if (matchingSignupWindow?.signupWindowStart.isAfter(timeNow)) {
    return dayjs(matchingSignupWindow.signupWindowStart).format();
  }

  if (game.programType === ProgramType.TABLETOP_RPG) {
    const phaseGap = getPhaseGap({
      startTime: dayjs(game.startTime),
      timeNow,
    });

    if (phaseGap.waitingForPhaseGapToEnd) {
      return phaseGap.phaseGapEndTime;
    }
  }

  return null;
};
