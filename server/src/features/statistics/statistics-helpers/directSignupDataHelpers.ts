import { differenceInMinutes, differenceInSeconds } from "date-fns";
import { groupBy, sortBy } from "remeda";
import { config } from "shared/config";
import {
  ProgramItem,
  ProgramType,
  SignupType,
  State,
} from "shared/types/models/programItem";
import { getDirectSignupStartTime } from "shared/utils/signupTimes";
import { getShortWeekdayAndTime } from "shared/utils/timeFormatter";
import {
  DirectSignupsForProgramItem,
  UserDirectSignup,
} from "server/features/direct-signup/directSignupTypes";
import { logger } from "server/utils/logger";

const formatElapsed = (from: Date, to: Date): string => {
  const totalMinutes = differenceInMinutes(to, from);
  if (totalMinutes <= 1) {
    return `${differenceInSeconds(to, from)}s`;
  }
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}h${minutes}min` : `${minutes}min`;
};

// Program items with Konsti sign-up that are still on, grouped by program
// type with each group in start-time order
const groupByProgramType = (
  programItems: ProgramItem[],
  includeProgramType: (programType: ProgramType) => boolean,
): Record<string, ProgramItem[]> =>
  groupBy(
    sortBy(
      programItems.filter(
        (programItem) =>
          programItem.signupType === SignupType.KONSTI &&
          programItem.state !== State.CANCELLED &&
          includeProgramType(programItem.programType),
      ),
      (programItem) => programItem.programType,
      (programItem) => programItem.startTime,
    ),
    (programItem) => programItem.programType,
  );

const findUserSignups = (
  directSignups: DirectSignupsForProgramItem[],
  programItem: ProgramItem,
): readonly UserDirectSignup[] =>
  directSignups.find(
    (directSignup) => directSignup.programItemId === programItem.programItemId,
  )?.userSignups ?? [];

// Two-phase program types are left out: the lottery fills them before direct
// sign-up opens, so the time to fill says little about the direct phase
export const printDirectSignupFillTimes = (
  directSignups: DirectSignupsForProgramItem[],
  programItems: ProgramItem[],
): void => {
  const { twoPhaseSignupProgramTypes } = config.event();
  const byProgramType = groupByProgramType(
    programItems,
    (programType) => !twoPhaseSignupProgramTypes.includes(programType),
  );

  for (const [programType, programItemsOfType] of Object.entries(
    byProgramType,
  )) {
    logger.info(`${programType} (${programItemsOfType.length} program items)`);

    let fullCount = 0;
    let underMinAttendanceCount = 0;
    let filledWithinMinuteCount = 0;

    for (const programItem of programItemsOfType) {
      const userSignups = findUserSignups(directSignups, programItem);

      const attendance = `${userSignups.length}/${programItem.maxAttendance}`;

      if (userSignups.length >= programItem.maxAttendance) {
        fullCount++;
      }
      if (userSignups.length < programItem.minAttendance) {
        underMinAttendanceCount++;
      }

      if (userSignups.length === 0) {
        logger.info(`  no sign-ups (${attendance}) - ${programItem.title}`);
        continue;
      }

      const directSignupStartTime = getDirectSignupStartTime(programItem);
      const signupTimes = sortBy(
        userSignups.map((userSignup) => new Date(userSignup.signupTime)),
        (signupTime) => signupTime.getTime(),
      );
      const secondsToSpot = (spots: number): number =>
        differenceInSeconds(signupTimes[spots - 1], directSignupStartTime);
      const elapsedToSpot = (spots: number): string =>
        formatElapsed(directSignupStartTime, signupTimes[spots - 1]);

      // A dropped spot that was taken again pushes the last sign-up late, so
      // when it came well after the one before it the time to one spot short
      // of full is shown beside it, to tell a refill from a slow fill
      const nearlyFull = programItem.maxAttendance - 1;
      const last = userSignups.length;
      const lastCameWellAfter =
        nearlyFull >= 1 &&
        last > nearlyFull &&
        secondsToSpot(last) - secondsToSpot(nearlyFull) > 60 &&
        secondsToSpot(last) > 2 * secondsToSpot(nearlyFull);
      const elapsed = lastCameWellAfter
        ? `${elapsedToSpot(nearlyFull)} for ${nearlyFull} spots, ${elapsedToSpot(last)} for ${last} spots`
        : elapsedToSpot(last);
      logger.info(`  ${elapsed} (${attendance}) - ${programItem.title}`);

      // A refilled program item counts by its first fill, one spot short
      const filledWithinMinute =
        last >= programItem.maxAttendance &&
        secondsToSpot(lastCameWellAfter ? nearlyFull : last) < 60;
      if (filledWithinMinute) {
        filledWithinMinuteCount++;
      }
    }

    const total = programItemsOfType.length;
    logger.info(`  Summary: ${fullCount} of ${total} program items full`);
    logger.info(
      `  Summary: ${underMinAttendanceCount} of ${total} program items under min attendance`,
    );
    logger.info(
      `  Summary: ${filledWithinMinuteCount} of ${total} program items filled in under a minute`,
    );
  }
};

// The two-phase program types, which the fill-time report leaves out: how
// many spots the lottery took and how many were left for direct sign-up
export const printProgramItemSignups = (
  directSignups: DirectSignupsForProgramItem[],
  programItems: ProgramItem[],
): void => {
  const { twoPhaseSignupProgramTypes } = config.event();
  const byProgramType = groupByProgramType(programItems, (programType) =>
    twoPhaseSignupProgramTypes.includes(programType),
  );

  for (const [programType, programItemsOfType] of Object.entries(
    byProgramType,
  )) {
    logger.info(`${programType} (${programItemsOfType.length} program items)`);

    for (const programItem of programItemsOfType) {
      const userSignups = findUserSignups(directSignups, programItem);

      const lotterySignups = userSignups.filter(
        (userSignup) => userSignup.priority !== 0,
      );
      const signupsAfterLottery = userSignups.filter(
        (userSignup) => userSignup.priority === 0,
      );

      logger.info(
        `  ${getShortWeekdayAndTime(programItem.startTime)} - max: ${programItem.maxAttendance} - lottery: ${lotterySignups.length} - direct: ${signupsAfterLottery.length}`,
      );
    }
  }
};
