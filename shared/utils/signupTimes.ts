import dayjs, { Dayjs } from "dayjs";
import { config } from "shared/config";
import { ProgramItem } from "shared/types/models/programItem";
import { TIMEZONE } from "shared/utils/initializeDayjs";
import { isDirectSignupAlwaysOpen } from "shared/utils/isDirectSignupAlwaysOpen";
import { isPreConventionWeekProgramItem } from "shared/utils/isPreConventionWeekProgramItem";

// Resolve a program item's effective start time, applying the parent override that batches
// several items into a single lottery run
export const getProgramItemStartTime = (programItem: ProgramItem): string => {
  const { startTimesByParentIds } = config.event();

  const parentStartTime = startTimesByParentIds.get(programItem.parentId);

  return parentStartTime ?? programItem.startTime;
};

// Open the whole batch at a fixed hour the previous evening. startOf("day") zeroes the
// minutes/seconds so an item starting at e.g. 09:15 opens at 22:00, not 22:15
const openAtFixedHourPreviousEvening = (
  timezoneStartTime: Dayjs,
  hour: number,
): Dayjs => timezoneStartTime.subtract(1, "day").startOf("day").hour(hour);

export const getLotterySignupStartTime = (programItem: ProgramItem): Dayjs => {
  const { eventStartTime, preSignupStart, fixedLotterySignupTime } =
    config.event();

  const startTime = getProgramItemStartTime(programItem);

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
    return openAtFixedHourPreviousEvening(timezoneStartTime, 22);
  }

  return timezoneStartTime;
};

export const getLotterySignupEndTime = (programItem: ProgramItem): Dayjs => {
  const { directSignupPhaseStart } = config.event();
  const startTime = getProgramItemStartTime(programItem);
  return dayjs(startTime).subtract(directSignupPhaseStart, "minutes");
};

export const getRollingDirectSignupStartTime = (
  programItem: ProgramItem,
  eventStartTime: string,
): Dayjs => {
  // Signup starts 4 hours before program item start time
  const rollingStartTime = dayjs(programItem.startTime).subtract(4, "hours");

  // Earliest start time is event start time
  if (rollingStartTime.isBefore(dayjs(eventStartTime))) {
    return dayjs(eventStartTime);
  }

  // If program item starts before 12:00, signup starts 18:00 previous day
  if (config.event().enableRollingDirectSignupPreviousDay) {
    // Set timezone because hour comparison and setting hour value
    const timezoneStartTime = dayjs(programItem.startTime).tz(TIMEZONE);
    const startTimeIsTooEarly = timezoneStartTime.hour() < 12;
    if (startTimeIsTooEarly) {
      return openAtFixedHourPreviousEvening(timezoneStartTime, 18);
    }
  }

  return rollingStartTime;
};

export const getDirectSignupStartTime = (programItem: ProgramItem): Dayjs => {
  const {
    eventStartTime,
    preConventionWeekSignupStartTime,
    directSignupPhaseStart,
    phaseGap,
    directSignupWindows,
    rollingDirectSignupProgramTypes,
    twoPhaseSignupProgramTypes,
  } = config.event();

  // ** SIGNUP ALWAYS OPEN **
  if (isDirectSignupAlwaysOpen(programItem)) {
    // Pre-convention week items take place before the event starts, so they have
    // their own signup start time instead of the event start time
    if (
      preConventionWeekSignupStartTime &&
      isPreConventionWeekProgramItem(programItem)
    ) {
      return dayjs(preConventionWeekSignupStartTime);
    }

    return dayjs(eventStartTime);
  }

  // ** TWO PHASE SIGNUPS **

  // 'twoPhaseSignupProgramTypes' signup times are configured with 'directSignupPhaseStart'
  if (twoPhaseSignupProgramTypes.includes(programItem.programType)) {
    const startTime = getProgramItemStartTime(programItem);
    const directSignupStart = dayjs(startTime).subtract(
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
    return getRollingDirectSignupStartTime(programItem, eventStartTime);
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

export const getDirectSignupEndTime = (programItem: ProgramItem): Dayjs => {
  return dayjs(programItem.startTime);
};

export const getLotterySignupNotStarted = (
  programItem: ProgramItem,
  timeNow: Dayjs,
): boolean => {
  const lotterySignupStartTime = getLotterySignupStartTime(programItem);
  return timeNow.isBefore(lotterySignupStartTime);
};

export const getLotterySignupInProgress = (
  programItem: ProgramItem,
  timeNow: Dayjs,
): boolean => {
  const lotterySignupStartTime = getLotterySignupStartTime(programItem);
  const lotterySignupEndTime = getLotterySignupEndTime(programItem);
  return (
    timeNow.isSameOrAfter(lotterySignupStartTime) &&
    timeNow.isSameOrBefore(lotterySignupEndTime)
  );
};

export const getPhaseGapInProgress = (
  programItem: ProgramItem,
  timeNow: Dayjs,
): boolean => {
  const { phaseGap } = config.event();
  const directSignupStartTime = getDirectSignupStartTime(programItem);

  // Delay showing lottery results immediately since lottery is still running
  const DELAY_SHOW_AFTER_LOTTERY = 1;

  const phaseGapStart = directSignupStartTime.subtract(
    phaseGap - DELAY_SHOW_AFTER_LOTTERY,
    "minutes",
  );

  return (
    timeNow.isSameOrAfter(phaseGapStart) &&
    timeNow.isBefore(directSignupStartTime)
  );
};

export const getDirectSignupInProgress = (
  programItem: ProgramItem,
  timeNow: Dayjs,
): boolean => {
  const directSignupStartTime = getDirectSignupStartTime(programItem);
  const directSignupEndTime = getDirectSignupEndTime(programItem);
  return (
    timeNow.isSameOrAfter(directSignupStartTime) &&
    timeNow.isSameOrBefore(directSignupEndTime)
  );
};

export const getDirectSignupEnded = (
  programItem: ProgramItem,
  timeNow: Dayjs,
): boolean => {
  const directSignupEndTime = getDirectSignupEndTime(programItem);
  return timeNow.isAfter(directSignupEndTime);
};
