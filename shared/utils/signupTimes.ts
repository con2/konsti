import { TZDate } from "@date-fns/tz";
import {
  addHours,
  addMinutes,
  getHours,
  isBefore,
  subDays,
  subHours,
  subMinutes,
} from "date-fns";
import { config } from "shared/config";
import { ProgramItem } from "shared/types/models/programItem";
import { isDirectSignupAlwaysOpen } from "shared/utils/isDirectSignupAlwaysOpen";
import { isPreConventionWeekProgramItem } from "shared/utils/isPreConventionWeekProgramItem";
import {
  isSameOrAfter,
  isSameOrBefore,
  isWithinMinutes,
} from "shared/utils/timeComparison";
import { TIMEZONE } from "shared/utils/timezone";
import { atWallClockHourInEventTimezone } from "shared/utils/zonedTime";

// A TZDate serialises to its own offset ("...+03:00") rather than to UTC, and these
// values are stored and compared as ISO strings elsewhere, so the timezone stays an
// internal detail of the arithmetic and never escapes in a return value
const toPlainDate = (time: Date): Date => new Date(time);

// The clamps below ("if the computed time falls before X, use X") use isBefore
// on purpose. An invalid time is not before anything, so it goes unclamped and
// stays invalid, and the predicates and server gates that consume it read as
// closed. Clamping it to a real instant instead would open sign-up for an item
// whose start time could not be resolved

// Resolve a program item's effective start time, applying the parent override that batches
// several items into a single lottery run
export const getProgramItemStartTime = (programItem: ProgramItem): string => {
  const { startTimesByParentIds } = config.event();

  const parentStartTime = startTimesByParentIds.get(programItem.parentId);

  return parentStartTime ?? programItem.startTime;
};

// Open the whole batch at a fixed hour the previous evening. The wanted instant is
// built from the previous calendar day and the hour, so an item starting at e.g.
// 09:15 opens at 22:00, not 22:15.
//
// Both steps run in the event timezone: stepping back a day keeps the wall-clock
// time even when that day is 23 or 25 hours long, and naming the hour explicitly
// resolves whichever UTC offset that day happens to have
const openAtFixedHourPreviousEvening = (
  timezoneStartTime: Date,
  hour: number,
): Date => {
  const previousDay = subDays(new TZDate(timezoneStartTime, TIMEZONE), 1);

  return atWallClockHourInEventTimezone(
    previousDay.getFullYear(),
    previousDay.getMonth(),
    previousDay.getDate(),
    hour,
  );
};

export const getLotterySignupStartTime = (programItem: ProgramItem): Date => {
  const { eventStartTime, preSignupStart, fixedLotterySignupTime } =
    config.event();

  const startTime = getProgramItemStartTime(programItem);

  // Set timezone because hour comparison and setting hour value
  const timezoneStartTime = fixedLotterySignupTime
    ? new TZDate(fixedLotterySignupTime, TIMEZONE)
    : subMinutes(new TZDate(startTime, TIMEZONE), preSignupStart);

  // If lottery sign-up starts before event start time, use event start time
  if (isBefore(timezoneStartTime, new Date(eventStartTime))) {
    return new Date(eventStartTime);
  }

  const startTimeIsTooEarly = getHours(timezoneStartTime) <= 6;

  if (startTimeIsTooEarly) {
    return openAtFixedHourPreviousEvening(timezoneStartTime, 22);
  }

  return toPlainDate(timezoneStartTime);
};

export const getLotterySignupEndTime = (programItem: ProgramItem): Date => {
  const { directSignupPhaseStart } = config.event();
  const startTime = getProgramItemStartTime(programItem);
  return subMinutes(new Date(startTime), directSignupPhaseStart);
};

export const getRollingDirectSignupStartTime = (
  programItem: ProgramItem,
  eventStartTime: string,
): Date => {
  // Sign-up starts 4 hours before program item start time
  const rollingStartTime = subHours(new Date(programItem.startTime), 4);

  // Earliest start time is event start time
  if (isBefore(rollingStartTime, new Date(eventStartTime))) {
    return new Date(eventStartTime);
  }

  // If program item starts before 12:00, sign-up starts 18:00 previous day
  if (config.event().enableRollingDirectSignupPreviousDay) {
    // Set timezone because hour comparison and setting hour value
    const timezoneStartTime = new TZDate(programItem.startTime, TIMEZONE);
    const startTimeIsTooEarly = getHours(timezoneStartTime) < 12;
    if (startTimeIsTooEarly) {
      return openAtFixedHourPreviousEvening(timezoneStartTime, 18);
    }
  }

  return rollingStartTime;
};

export const getDirectSignupStartTime = (programItem: ProgramItem): Date => {
  const {
    eventStartTime,
    preConventionWeekSignupStartTime,
    directSignupPhaseStart,
    phaseGap,
    directSignupWindows,
    rollingDirectSignupProgramTypes,
    twoPhaseSignupProgramTypes,
  } = config.event();

  // ** SIGN-UP ALWAYS OPEN **
  if (isDirectSignupAlwaysOpen(programItem)) {
    // Pre-convention week items take place before the event starts, so they have
    // their own sign-up start time instead of the event start time
    if (
      preConventionWeekSignupStartTime &&
      isPreConventionWeekProgramItem(programItem)
    ) {
      return new Date(preConventionWeekSignupStartTime);
    }

    return new Date(eventStartTime);
  }

  // ** TWO PHASE SIGN-UPS **

  // 'twoPhaseSignupProgramTypes' sign-up times are configured with 'directSignupPhaseStart'
  if (twoPhaseSignupProgramTypes.includes(programItem.programType)) {
    const startTime = getProgramItemStartTime(programItem);
    const directSignupStart = subMinutes(
      new Date(startTime),
      directSignupPhaseStart,
    );

    // If event starts at 15:00, 'directSignupPhaseStart' is 2h and 'phaseGap' is 15min
    //   Start time 15:00 -> sign-up start 13:00 -> fix to 15:00
    //   Start time 16:00 -> sign-up start 14:00 -> fix to 15:00
    //   Start time 17:00 -> sign-up start 15:15 -> fix to 15:00
    //   Start time 18:00 -> sign-up start 16:15 -> this is fine
    const signupsBeforeThisStartAtEventStart = addHours(
      new Date(eventStartTime),
      1,
    );

    if (isBefore(directSignupStart, signupsBeforeThisStartAtEventStart)) {
      return new Date(eventStartTime);
    }

    const directSignupStartWithPhaseGap = addMinutes(
      directSignupStart,
      phaseGap,
    );

    return directSignupStartWithPhaseGap;
  }

  // ** ROLLING DIRECT SIGN-UP **

  if (rollingDirectSignupProgramTypes.includes(programItem.programType)) {
    return getRollingDirectSignupStartTime(programItem, eventStartTime);
  }

  // ** DIRECT SIGN-UP WINDOWS **

  // Other program types use "directSignupWindows" config
  const signupWindowsForProgramType = directSignupWindows
    ? directSignupWindows[programItem.programType]
    : undefined;

  if (!signupWindowsForProgramType) {
    return new Date(eventStartTime);
  }

  const matchingSignupWindow = signupWindowsForProgramType.find(
    (signupWindow) =>
      isWithinMinutes(
        new Date(programItem.startTime),
        new Date(signupWindow.signupWindowStart),
        new Date(signupWindow.signupWindowClose),
      ),
  );

  return new Date(matchingSignupWindow?.signupWindowStart ?? eventStartTime);
};

export const getDirectSignupEndTime = (programItem: ProgramItem): Date => {
  return new Date(programItem.startTime);
};

export const getLotterySignupNotStarted = (
  programItem: ProgramItem,
  timeNow: Date,
): boolean => {
  const lotterySignupStartTime = getLotterySignupStartTime(programItem);
  // A negated timestamp comparison rather than isBefore, which is false when
  // either side is invalid and would report the sign-up as already open. Same
  // direction as the server's gate, so the help text cannot invite a sign-up
  // the server then rejects
  return !isSameOrAfter(timeNow, lotterySignupStartTime);
};

export const getLotterySignupInProgress = (
  programItem: ProgramItem,
  timeNow: Date,
): boolean => {
  const lotterySignupStartTime = getLotterySignupStartTime(programItem);
  const lotterySignupEndTime = getLotterySignupEndTime(programItem);
  return (
    isSameOrAfter(timeNow, lotterySignupStartTime) &&
    isSameOrBefore(timeNow, lotterySignupEndTime)
  );
};

export const getPhaseGapInProgress = (
  programItem: ProgramItem,
  timeNow: Date,
): boolean => {
  const { phaseGap } = config.event();
  const directSignupStartTime = getDirectSignupStartTime(programItem);

  // Delay showing lottery results immediately since lottery is still running
  const DELAY_SHOW_AFTER_LOTTERY = 1;

  const phaseGapStart = subMinutes(
    directSignupStartTime,
    phaseGap - DELAY_SHOW_AFTER_LOTTERY,
  );

  return (
    isSameOrAfter(timeNow, phaseGapStart) &&
    isBefore(timeNow, directSignupStartTime)
  );
};

export const getDirectSignupInProgress = (
  programItem: ProgramItem,
  timeNow: Date,
): boolean => {
  const directSignupStartTime = getDirectSignupStartTime(programItem);
  const directSignupEndTime = getDirectSignupEndTime(programItem);
  return (
    isSameOrAfter(timeNow, directSignupStartTime) &&
    isSameOrBefore(timeNow, directSignupEndTime)
  );
};

export const getDirectSignupEnded = (
  programItem: ProgramItem,
  timeNow: Date,
): boolean => {
  const directSignupEndTime = getDirectSignupEndTime(programItem);
  // Negated for the same reason as the lottery predicate: a time that cannot be
  // resolved has to read as ended rather than as still open
  return !isSameOrBefore(timeNow, directSignupEndTime);
};
