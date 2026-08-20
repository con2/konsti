import { TZDate } from "@date-fns/tz";
import { getMinutes } from "date-fns";
import { ProgramType } from "shared/types/models/programItem";
import { getTime } from "shared/utils/timeFormatter";
import { TIMEZONE } from "shared/utils/timezone";
import { db } from "server/db/mongodb";
import { findProgramItems } from "server/features/program-item/programItemRepository";
import { unsafelyUnwrap } from "server/test/utils/unsafelyUnwrapResult";
import { logger } from "server/utils/logger";

const checkStartTimes = async (): Promise<void> => {
  await db.connectToDb();
  const programItems = unsafelyUnwrap(await findProgramItems());

  const rpgs = programItems.filter(
    (programItem) => programItem.programType === ProgramType.TABLETOP_RPG,
  );

  for (const rpg of rpgs) {
    const startMinute = getMinutes(new TZDate(rpg.startTime, TIMEZONE));
    if (startMinute !== 0) {
      logger.info(`${getTime(rpg.startTime)} - ${rpg.title}`);
    }
  }

  await db.gracefulExit();
};

try {
  await checkStartTimes();
} catch (error: unknown) {
  logger.error(error);
}
