import dayjs, { Dayjs } from "dayjs";
import { config } from "shared/config";
import { Game } from "shared/types/models/game";
import { TIMEZONE } from "shared/utils/initializeDayjs";

export const getAlgorithmSignupStartTime = (startTime: string): Dayjs => {
  const { conventionStartTime, PRE_SIGNUP_START } = config.shared();

  // Set timezone here because hour comparison and setting hour value
  const timezoneStartTime = dayjs(startTime)
    .tz(TIMEZONE)
    .subtract(PRE_SIGNUP_START, "minutes");

  // If algorithm signup starts before convention start time, use convention start time
  if (timezoneStartTime.isBefore(dayjs(conventionStartTime))) {
    return dayjs(conventionStartTime);
  }

  const startTimeIsTooEarly = timezoneStartTime.hour() <= 6;

  if (startTimeIsTooEarly) {
    return timezoneStartTime.subtract(1, "day").hour(22);
  }
  return timezoneStartTime;
};

export const getAlgorithmSignupEndTime = (startTime: string): Dayjs => {
  const { DIRECT_SIGNUP_START } = config.shared();
  return dayjs(startTime).subtract(DIRECT_SIGNUP_START, "minutes");
};

export const getDirectSignupStartTime = (game: Game): Dayjs => {
  const {
    conventionStartTime,
    conventionEndTime,
    DIRECT_SIGNUP_START,
    PHASE_GAP,
    directSignupWindows,
    directSignupAlwaysOpenIds,
    twoPhaseSignupProgramTypes,
  } = config.shared();

  const signupAlwaysOpen = directSignupAlwaysOpenIds.includes(game.gameId);

  if (signupAlwaysOpen) {
    const someOldTime = "2000-01-01T00:00:00.000Z";
    return dayjs(someOldTime);
  }

  // "twoPhaseSignupProgramTypes" signup times are configured with DIRECT_SIGNUP_START
  if (twoPhaseSignupProgramTypes.includes(game.programType)) {
    const directSignupStart = dayjs(game.startTime).subtract(
      DIRECT_SIGNUP_START,
      "minutes",
    );

    // If convention starts at 15:00, DIRECT_SIGNUP_START is 2h and PHASE_GAP is 15min
    //   Start time 15:00 -> signup start 13:00 -> fix to 15:00
    //   Start time 16:00 -> signup start 14:00 -> fix to 15:00
    //   Start time 17:00 -> signup start 15:15 -> fix to 15:00
    //   Start time 18:00 -> signup start 16:15 -> this is fine
    const signupsBeforeThisStartAtConventionStart = dayjs(
      conventionStartTime,
    ).add(1, "hour");

    if (
      dayjs(directSignupStart).isBefore(signupsBeforeThisStartAtConventionStart)
    ) {
      return dayjs(conventionStartTime);
    }

    const directSignupStartWithPhaseGap = directSignupStart.add(
      PHASE_GAP,
      "minutes",
    );

    return directSignupStartWithPhaseGap;
  }

  // Other program types use signup windows for signup times
  const signupWindowsForProgramType = directSignupWindows
    ? directSignupWindows[game.programType]
    : undefined;

  const matchingSignupWindow = signupWindowsForProgramType
    ? signupWindowsForProgramType.find((signupWindow) =>
        dayjs(game.startTime).isBetween(
          signupWindow.signupWindowStart,
          signupWindow.signupWindowClose,
          "minutes",
          "[]",
        ),
      )
    : {
        signupWindowStart: dayjs(conventionStartTime),
        signupWindowClose: dayjs(conventionEndTime),
      };

  if (!matchingSignupWindow) {
    // eslint-disable-next-line no-restricted-syntax -- Config error
    throw new Error(
      `Invalid signup window for program type: ${game.programType}`,
    );
  }

  return dayjs(matchingSignupWindow.signupWindowStart);
};
