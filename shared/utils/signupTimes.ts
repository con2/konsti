import dayjs, { Dayjs } from "dayjs";
import { config } from "shared/config";
import { ProgramItem } from "shared/types/models/programItem";
import { TIMEZONE } from "shared/utils/initializeDayjs";

export const getAlgorithmSignupStartTime = (startTime: string): Dayjs => {
  const { conventionStartTime, PRE_SIGNUP_START } = config.event();

  // Set timezone because hour comparison and setting hour value
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
  const { DIRECT_SIGNUP_START } = config.event();
  return dayjs(startTime).subtract(DIRECT_SIGNUP_START, "minutes");
};

export const getDirectSignupStartTime = (programItem: ProgramItem): Dayjs => {
  const {
    conventionStartTime,
    DIRECT_SIGNUP_START,
    PHASE_GAP,
    directSignupWindows,
    rollingSignupStartProgramTypes,
    directSignupAlwaysOpenIds,
    twoPhaseSignupProgramTypes,
  } = config.event();

  // ** SIGNUP ALWAYS OPEN **
  const signupAlwaysOpen = directSignupAlwaysOpenIds.includes(
    programItem.programItemId,
  );

  if (signupAlwaysOpen) {
    return dayjs(conventionStartTime);
  }

  // ** TWO PHASE SIGNUPS **

  // "twoPhaseSignupProgramTypes" signup times are configured with DIRECT_SIGNUP_START
  if (twoPhaseSignupProgramTypes.includes(programItem.programType)) {
    const directSignupStart = dayjs(programItem.startTime).subtract(
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

  // ** ROLLING DIRECT SIGNUP **

  if (rollingSignupStartProgramTypes.includes(programItem.programType)) {
    // Signup starts 4 hours before program item start time
    const rollingStartTime = dayjs(programItem.startTime).subtract(4, "hours");

    // Earliest start time is convention start time
    if (rollingStartTime.isBefore(dayjs(conventionStartTime))) {
      return dayjs(conventionStartTime);
    }

    // If program item starts before 12:00, signup starts 18:00 previous day

    // Set timezone because hour comparison and setting hour value
    const timezoneStartTime = dayjs(programItem.startTime).tz(TIMEZONE);
    const startTimeIsTooEarly = timezoneStartTime.hour() < 12;
    if (startTimeIsTooEarly) {
      return timezoneStartTime.subtract(1, "day").hour(18);
    }

    return rollingStartTime;
  }

  // ** DIRECT SIGNUP WINDOWS **

  // Other program types use "directSignupWindows" config
  const signupWindowsForProgramType = directSignupWindows
    ? directSignupWindows[programItem.programType]
    : undefined;

  if (!signupWindowsForProgramType) {
    return dayjs(conventionStartTime);
  }

  const matchingSignupWindow = signupWindowsForProgramType.find(
    (signupWindow) =>
      dayjs(programItem.startTime).isBetween(
        signupWindow.signupWindowStart,
        signupWindow.signupWindowClose,
        "minutes",
        "[)", // Include windowStart, exclude windowClose
      ),
  );

  return matchingSignupWindow?.signupWindowStart ?? dayjs(conventionStartTime);
};
