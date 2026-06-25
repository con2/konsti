import dayjs from "dayjs";
import { db } from "server/db/mongodb";
import { findProgramItems } from "server/features/program-item/programItemRepository";
import { unsafelyUnwrap } from "server/test/utils/unsafelyUnwrapResult";
import { logger } from "server/utils/logger";
import { ProgramType } from "shared/types/models/programItem";
import { initializeDayjs } from "shared/utils/initializeDayjs";
import { getTime } from "shared/utils/timeFormatter";

const checkStartTimes = async (): Promise<void> => {
  initializeDayjs();
  await db.connectToDb();
  const programItems = unsafelyUnwrap(await findProgramItems());

  const rpgs = programItems.filter(
    (programItem) => programItem.programType === ProgramType.TABLETOP_RPG,
  );

  for (const rpg of rpgs) {
    const startMinute = dayjs(rpg.startTime).minute();
    if (startMinute !== 0) {
      logger.info(`${getTime(rpg.startTime)} - ${rpg.title}`);
    }
  }

  await db.gracefulExit();
};

try {
  await checkStartTimes();
} catch (error: unknown) {
  logger.error("%s", error);
}
