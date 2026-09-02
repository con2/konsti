import { TZDate } from "@date-fns/tz";
import {
  addHours,
  addMinutes,
  getHours,
  isAfter,
  isBefore,
  startOfMinute,
  subDays,
  subHours,
  subMinutes,
} from "date-fns";
import { config } from "shared/config";
import { ProgramItem } from "shared/types/models/programItem";
import { isDirectSignupAlwaysOpen } from "shared/utils/isDirectSignupAlwaysOpen";
import { isLotterySignupProgramItem } from "shared/utils/isLotterySignupProgramItem";
import { isPreConventionWeekProgramItem } from "shared/utils/isPreConventionWeekProgramItem";
import {
  isSameOrAfter,
  isSameOrBefore,
  isSameTime,
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
// whose start time could not be resolved.

// Apply the parent override that batches several items into a single lottery
// run. Takes the parts rather than a program item, for the helpers below that
// hold a stored time instead of the item it points at.
const resolveStartTime = (
  parentId: string | undefined,
  ownStartTime: string,
): string => {
  const { startTimesByParentIds } = config.event();

  if (parentId === undefined) {
    return ownStartTime;
  }

  return startTimesByParentIds.get(parentId) ?? ownStartTime;
};

// Resolve a program item's effective start time
export const getProgramItemStartTime = (programItem: ProgramItem): string =>
  resolveStartTime(programItem.parentId, programItem.startTime);

// The lottery a program item belongs to, as a value callers can group and compare by. Batched
// program items share one lottery, so the parent override decides it. Truncated to the minute to
// match the comparison the run itself uses, which is what keys grouped this way are handed to.
export const getLotteryRunTime = (programItem: ProgramItem): string =>
  startOfMinute(new Date(getProgramItemStartTime(programItem))).toISOString();

// Open the whole batch at a fixed hour the previous evening. The wanted instant is
// built from the previous calendar day and the hour, so an item starting at e.g.
// 09:15 opens at 22:00, not 22:15.
//
// Both steps run in the event timezone: stepping back a day keeps the wall-clock
// time even when that day is 23 or 25 hours long, and naming the hour explicitly
// resolves whichever UTC offset that day happens to have.
const openAtFixedHourPreviousEvening = (
  timezoneStartTime: TZDate,
  hour: number,
): Date => {
  // date-fns keeps the operand's own class, so this stays in the event timezone
  const previousDay = subDays(timezoneStartTime, 1);

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

// Whether a program item runs at a given time, once the parent override is applied. Compared to
// the minute because the two can be the same moment written differently - a configured parent
// time carries no milliseconds.
export const isSameStartTime = (
  programItemStartTime: string,
  comparedTime: string,
  parentId: string | undefined,
): boolean =>
  isSameTime(resolveStartTime(parentId, programItemStartTime), comparedTime);

// Marked for a slot it no longer starts at: its lottery ran and a reschedule moved it, so it
// does not go into another one. Asked of the item's own start time rather than the parent
// override, which batches the run and does not move when the item does.
export const hasLotteryAlreadyRun = (programItem: ProgramItem): boolean =>
  programItem.lotteryRanForStartTime !== undefined &&
  !isSameTime(programItem.startTime, programItem.lotteryRanForStartTime);

// A lottery ran for this program item, wherever it now sits. Broader than the predicate above,
// which answers only for one that has moved since. The automatic removals need this one: the
// sign-up window is derived from the current start time, so a move to a later slot reopens it.
export const lotteryRanForProgramItem = (programItem: ProgramItem): boolean =>
  programItem.lotteryRanForStartTime !== undefined;

// No lottery will take this program item: it was passed over for holding sign-ups, or it moved
// onto a slot after its own lottery ran. Both are recorded, so neither answer expires.
export const willNotBeLotteried = (programItem: ProgramItem): boolean =>
  programItem.passedOverForLottery === true ||
  hasLotteryAlreadyRun(programItem);

// The first slots of the event get direct sign-up: there is no room for a lottery window before
// the doors open. Derived rather than a fixed three hours, so it stays the same boundary the
// direct sign-up time clamps at - the hour of slack past the last lottery that could close at the
// event start. How many slots that covers follows from the settings; with doors at 15:00,
// 'preSignupStart' 4h and 'directSignupPhaseStart' 2h it is the first three:
//   Start time 15:00 -> lottery 11:00-13:00 -> use direct
//   Start time 16:00 -> lottery 12:00-14:00 -> use direct
//   Start time 17:00 -> lottery 13:00-15:00 -> use direct
//   Start time 18:00 -> lottery 14:00-16:00 -> lottery with shorter duration 15:00-16:00
//   Start time 19:00 -> lottery 15:00-17:00 -> show normally
export const tooEarlyForLotterySignup = (programItem: ProgramItem): boolean => {
  const { eventStartTime, directSignupPhaseStart } = config.event();

  // The lottery window is driven by the parent-resolved start time, so use it here too
  const startTime = getProgramItemStartTime(programItem);

  const noLotterySignupBefore = addHours(
    addMinutes(new Date(eventStartTime), directSignupPhaseStart),
    1,
  );

  return isBefore(new Date(startTime), noLotterySignupBefore);
};

export const getRollingDirectSignupStartTime = (
  programItem: ProgramItem,
  eventStartTime: string,
): Date => {
  const {
    enableRollingDirectSignupPreviousDay,
    rollingDirectSignupEarliestStartTime,
  } = config.event();

  // Sign-up can be held back past the event start, which is pulled early when
  // the lottery opens from it. Never before the event start, though.
  const earliestStartTime =
    rollingDirectSignupEarliestStartTime &&
    isAfter(
      new Date(rollingDirectSignupEarliestStartTime),
      new Date(eventStartTime),
    )
      ? new Date(rollingDirectSignupEarliestStartTime)
      : new Date(eventStartTime);

  // Sign-up starts 4 hours before program item start time
  const rollingStartTime = subHours(new Date(programItem.startTime), 4);

  if (isBefore(rollingStartTime, earliestStartTime)) {
    return earliestStartTime;
  }

  // If program item starts before 12:00, sign-up starts 18:00 previous day
  if (enableRollingDirectSignupPreviousDay) {
    // Set timezone because hour comparison and setting hour value
    const timezoneStartTime = new TZDate(programItem.startTime, TIMEZONE);
    const startTimeIsTooEarly = getHours(timezoneStartTime) < 12;
    if (startTimeIsTooEarly) {
      const previousEvening = openAtFixedHourPreviousEvening(
        timezoneStartTime,
        18,
      );
      // The previous evening can land before the earliest start time even when the
      // rolling time does not, so it is clamped too
      return isBefore(previousEvening, earliestStartTime)
        ? earliestStartTime
        : previousEvening;
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
  // the server then rejects.
  return !isSameOrAfter(timeNow, lotterySignupStartTime);
};

// Past the point where the lottery for this program item decides it, so a sign-up for it is a
// record of having entered rather than a pending request. Deliberately a negated comparison: a
// start time that cannot be resolved makes both directions false, and here that has to read as
// ended, because the callers are automatic deletions that must fail towards keeping.
export const getLotterySignupEnded = (
  programItem: ProgramItem,
  timeNow: Date,
): boolean => !isBefore(timeNow, getLotterySignupEndTime(programItem));

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

// Whether the first-come phase for this program item's starting time has begun on the schedule.
// A property of the starting time rather than of the program item: it stays false for one let out
// early, which is what the lottery run gating needs - a program item no lottery will take is
// skipped by the run, and must not make the whole start time read as too late to lottery.
export const getDirectSignupPhaseStarted = (
  programItem: ProgramItem,
  timeNow: Date,
): boolean => isSameOrAfter(timeNow, getDirectSignupStartTime(programItem));

// Direct sign-up never opens twice. A program item no lottery will take has had its sign-up open
// already - before it moved, or under the schedule it collected sign-ups by - so it stays open
// rather than shutting against a schedule pointing at a phase that will not happen. One still
// headed for a lottery is unaffected, so the gap after a lottery is never skipped.
export const getDirectSignupStarted = (
  programItem: ProgramItem,
  timeNow: Date,
): boolean =>
  willNotBeLotteried(programItem) ||
  getDirectSignupPhaseStarted(programItem, timeNow);

export const getPhaseGapInProgress = (
  programItem: ProgramItem,
  timeNow: Date,
): boolean => {
  // The gap belongs to a lottery, so only a program item with one still ahead of it has a gap
  // to wait out. A rolling or windowed schedule takes its sign-up time from somewhere else
  // entirely, and an early slot has no lottery window to be gapped from.
  if (
    willNotBeLotteried(programItem) ||
    !isLotterySignupProgramItem(programItem) ||
    tooEarlyForLotterySignup(programItem)
  ) {
    return false;
  }

  const lotterySignupEndTime = getLotterySignupEndTime(programItem);
  const directSignupStartTime = getDirectSignupStartTime(programItem);

  // Delay showing lottery results immediately since lottery is still running
  const DELAY_SHOW_AFTER_LOTTERY = 1;

  const phaseGapStart = addMinutes(
    lotterySignupEndTime,
    DELAY_SHOW_AFTER_LOTTERY,
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
  const directSignupEndTime = getDirectSignupEndTime(programItem);
  return (
    getDirectSignupStarted(programItem, timeNow) &&
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
