import dayjs, { Dayjs } from "dayjs";
import { sharedConfig } from "shared/config/sharedConfig";
import { Game, ProgramType } from "shared/typings/models/game";
import { TIMEZONE } from "shared/utils/initializeDayjs";

const {
  PRE_SIGNUP_START,
  DIRECT_SIGNUP_START,
  CONVENTION_START_TIME,
  PHASE_GAP,
} = sharedConfig;

export const getAlgorithmSignupStartTime = (startTime: string): Dayjs => {
  // Set timezone here because hour comparison and setting hour value
  const timezoneStartTime = dayjs(startTime)
    .tz(TIMEZONE)
    .subtract(PRE_SIGNUP_START, "minutes");

  // If algorithm signup starts before convention start time, use convention start time
  if (timezoneStartTime.isBefore(dayjs(CONVENTION_START_TIME))) {
    return dayjs(CONVENTION_START_TIME);
  }

  const startTimeIsTooEarly = timezoneStartTime.hour() <= 6;

  if (startTimeIsTooEarly) {
    return timezoneStartTime.subtract(1, "day").hour(22);
  }
  return timezoneStartTime;
};

export const getAlgorithmSignupEndTime = (startTime: string): Dayjs => {
  return dayjs(startTime).subtract(DIRECT_SIGNUP_START, "minutes");
};

export const getDirectSignupStartTime = (game: Game): Dayjs => {
  const signupAlwaysOpen = sharedConfig.directSignupAlwaysOpenIds.includes(
    game.gameId
  );

  if (signupAlwaysOpen) {
    const someOldTime = "2000-01-01T00:00:00.000Z";
    return dayjs(someOldTime);
  }

  // RPG signup times are configured with DIRECT_SIGNUP_START
  if (game.programType === ProgramType.TABLETOP_RPG) {
    const directSignupStart = dayjs(game.startTime).subtract(
      DIRECT_SIGNUP_START,
      "minutes"
    );

    // If convention starts at 15:00, DIRECT_SIGNUP_START is 2h and PHASE_GAP is 15min
    //   Start time 15:00 -> signup start 13:00 -> fix to 15:00
    //   Start time 16:00 -> signup start 14:00 -> fix to 15:00
    //   Start time 17:00 -> signup start 15:15 -> fix to 15:00
    //   Start time 18:00 -> signup start 16:15 -> this is fine
    const signupsBeforeThisStartAtConventionStart = dayjs(
      CONVENTION_START_TIME
    ).add(1, "hour");

    if (
      dayjs(directSignupStart).isBefore(signupsBeforeThisStartAtConventionStart)
    ) {
      return dayjs(CONVENTION_START_TIME);
    }

    const directSignupStartWithPhaseGap = directSignupStart.add(
      PHASE_GAP,
      "minutes"
    );

    return directSignupStartWithPhaseGap;
  }

  // Other program types use signup windows for signup times
  const signupWindowsForProgramType =
    sharedConfig.directSignupWindows[game.programType];

  const matchingSignupWindow =
    signupWindowsForProgramType.find((signupWindow) =>
      dayjs(game.startTime).isBetween(
        signupWindow.signupWindowStart,
        signupWindow.signupWindowClose,
        "minutes",
        "[]"
      )
    ) ?? signupWindowsForProgramType[0];

  return dayjs(matchingSignupWindow.signupWindowStart);
};
