import dayjs, { Dayjs } from "dayjs";
import { config } from "shared/config";
import { ProgramItem } from "shared/types/models/programItem";
import { TIMEZONE } from "shared/utils/initializeDayjs";

export const getLotterySignupStartTime = (startTime: string): Dayjs => {
  const { eventStartTime, preSignupStart, fixedLotterySignupTime } =
    config.event();

  // Set timezone because hour comparison and setting hour value
  const timezoneStartTime = fixedLotterySignupTime
    ? dayjs(fixedLotterySignupTime).tz(TIMEZONE)
    : dayjs(startTime).tz(TIMEZONE).subtract(preSignupStart, "minutes");

  // If lottery signup starts before event start time, use event start time
  if (timezoneStartTime.isBefore(dayjs(eventStartTime))) {
    return dayjs(eventStartTime);
  }

  const startTimeIsTooEarly = timezoneStartTime.hour() <= 6;

  if (startTimeIsTooEarly) {
    return timezoneStartTime.subtract(1, "day").hour(22);
  }
  return timezoneStartTime;
};

export const getLotterySignupEndTime = (startTime: string): Dayjs => {
  const { directSignupPhaseStart } = config.event();
  return dayjs(startTime).subtract(directSignupPhaseStart, "minutes");
};

export const getDirectSignupStartTime = (programItem: ProgramItem): Dayjs => {
  const {
    eventStartTime,
    directSignupPhaseStart,
    phaseGap,
    directSignupWindows,
    rollingDirectSignupProgramTypes,
    enableRollingDirectSignupPreviousDay,
    directSignupAlwaysOpenIds,
    twoPhaseSignupProgramTypes,
  } = config.event();

  // ** SIGNUP ALWAYS OPEN **
  const signupAlwaysOpen = directSignupAlwaysOpenIds.includes(
    programItem.programItemId,
  );

  if (signupAlwaysOpen) {
    return dayjs(eventStartTime);
  }

  // ** TWO PHASE SIGNUPS **

  // 'twoPhaseSignupProgramTypes' signup times are configured with 'directSignupPhaseStart'
  if (twoPhaseSignupProgramTypes.includes(programItem.programType)) {
    const directSignupStart = dayjs(programItem.startTime).subtract(
      directSignupPhaseStart,
      "minutes",
    );

    // If event starts at 15:00, 'directSignupPhaseStart' is 2h and 'phaseGap' is 15min
    //   Start time 15:00 -> signup start 13:00 -> fix to 15:00
    //   Start time 16:00 -> signup start 14:00 -> fix to 15:00
    //   Start time 17:00 -> signup start 15:15 -> fix to 15:00
    //   Start time 18:00 -> signup start 16:15 -> this is fine
    const signupsBeforeThisStartAtEventStart = dayjs(eventStartTime).add(
      1,
      "hour",
    );

    if (dayjs(directSignupStart).isBefore(signupsBeforeThisStartAtEventStart)) {
      return dayjs(eventStartTime);
    }

    const directSignupStartWithPhaseGap = directSignupStart.add(
      phaseGap,
      "minutes",
    );

    return directSignupStartWithPhaseGap;
  }

  // ** ROLLING DIRECT SIGNUP **

  if (rollingDirectSignupProgramTypes.includes(programItem.programType)) {
    // Signup starts 4 hours before program item start time
    const rollingStartTime = dayjs(programItem.startTime).subtract(4, "hours");

    // Earliest start time is event start time
    if (rollingStartTime.isBefore(dayjs(eventStartTime))) {
      return dayjs(eventStartTime);
    }

    // If program item starts before 12:00, signup starts 18:00 previous day
    if (enableRollingDirectSignupPreviousDay) {
      // Set timezone because hour comparison and setting hour value
      const timezoneStartTime = dayjs(programItem.startTime).tz(TIMEZONE);
      const startTimeIsTooEarly = timezoneStartTime.hour() < 12;
      if (startTimeIsTooEarly) {
        return timezoneStartTime.subtract(1, "day").hour(18);
      }
    }

    return rollingStartTime;
  }

  // ** DIRECT SIGNUP WINDOWS **

  // Other program types use "directSignupWindows" config
  const signupWindowsForProgramType = directSignupWindows
    ? directSignupWindows[programItem.programType]
    : undefined;

  if (!signupWindowsForProgramType) {
    return dayjs(eventStartTime);
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

  return matchingSignupWindow?.signupWindowStart ?? dayjs(eventStartTime);
};
