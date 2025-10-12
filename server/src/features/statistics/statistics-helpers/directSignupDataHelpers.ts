import dayjs from "dayjs";
import { sortBy } from "remeda";
import { DirectSignupsForProgramItem } from "server/features/direct-signup/directSignupTypes";
import { logger } from "server/utils/logger";
import { config } from "shared/config";
import {
  ProgramItem,
  ProgramType,
  State,
} from "shared/types/models/programItem";
import { getRollingDirectSignupStartTime } from "shared/utils/signupTimes";
import { getShortWeekdayAndTime } from "shared/utils/timeFormatter";

export const printRpgDirectSignupFullTimes = (
  directSignups: (DirectSignupsForProgramItem & { updatedAt: string })[],
  programItems: ProgramItem[],
): void => {
  const rpgDirectSignups = directSignups.filter((directSignup) =>
    programItems.find(
      (programItem) =>
        programItem.programItemId === directSignup.programItemId &&
        programItem.programType === ProgramType.TABLETOP_RPG,
    ),
  );

  logger.info(
    `Loaded direct signups for ${rpgDirectSignups.length} RPG program items`,
  );

  rpgDirectSignups.flatMap((rpgDirectSignup) => {
    const programItem = programItems.find(
      (p) => p.programItemId === rpgDirectSignup.programItemId,
    );
    if (!programItem || programItem.state === State.CANCELLED) {
      return [];
    }

    const directSignupStartTime = getRollingDirectSignupStartTime(
      programItem,
      config.event().eventStartTime, // TODO: Read this from event config file
    );

    const programItemFullTime = dayjs(rpgDirectSignup.updatedAt);

    const totalMinutes = programItemFullTime.diff(
      directSignupStartTime,
      "minutes",
    );

    const attendance = `${rpgDirectSignup.count}/${programItem.maxAttendance}`;

    if (totalMinutes <= 1) {
      const seconds = programItemFullTime.diff(
        directSignupStartTime,
        "seconds",
      );
      logger.info(`${seconds}s (${attendance}) - ${programItem.title}`);
      return;
    }

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours > 0) {
      logger.info(
        `${hours}h${minutes}min (${attendance}) - ${programItem.title}`,
      );
    } else {
      logger.info(`${minutes}min (${attendance}) - ${programItem.title}`);
    }
  });
};

export const printProgramItemSignups = (
  directSignups: (DirectSignupsForProgramItem & { updatedAt: string })[],
  programItems: ProgramItem[],
): void => {
  const fleaMarketDirectSignups = directSignups.filter((directSignup) =>
    programItems.find(
      (programItem) =>
        programItem.programItemId === directSignup.programItemId &&
        programItem.programType === ProgramType.FLEAMARKET,
    ),
  );

  const sorted = sortBy(
    fleaMarketDirectSignups,
    (signup) => signup.programItemId,
  );

  sorted.map((directSignup) => {
    const lotterySignups = directSignup.userSignups.filter(
      (userSignup) => userSignup.priority !== 0,
    );
    const signupsAfterLottery = directSignup.userSignups.filter(
      (userSignup) => userSignup.priority === 0,
    );

    const programItem = programItems.find(
      (p) => p.programItemId === directSignup.programItemId,
    );

    if (!programItem) {
      return;
    }

    logger.info(
      `${getShortWeekdayAndTime(programItem.startTime)} - max: ${programItem.maxAttendance} - lottery: ${lotterySignups.length} - direct: ${signupsAfterLottery.length}`,
    );
  });
};
