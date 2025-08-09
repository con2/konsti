import fs from "node:fs";
import path from "node:path";
import dayjs from "dayjs";
import { db } from "server/db/mongodb";
import { saveProgramItems } from "server/features/program-item/programItemRepository";
import { addSignupQuestions } from "server/features/program-item/utils/addSignupQuestions";
import { findSettings } from "server/features/settings/settingsRepository";
import { logger } from "server/utils/logger";
import { config } from "shared/config";
import { ProgramItem } from "shared/types/models/programItem";
import { initializeDayjs } from "shared/utils/initializeDayjs";

const updatePastEventProgramItems = async (): Promise<void> => {
  const { eventStartTime } = config.event();

  // Tracon 2024 start time
  const oldStartTime = "2024-09-06T05:00:00Z";

  const rawData = fs.readFileSync(
    path.join(
      __dirname,
      "../../features/statistics/datafiles/tracon/2024/program-items.json",
    ),
    "utf8",
  );

  const programItems = JSON.parse(rawData) as ProgramItem[];

  await saveProgramItems(
    programItems.map((programItem) => {
      const timeDifference = dayjs(programItem.startTime).diff(
        dayjs(oldStartTime),
        "hour",
        true,
      );

      return {
        ...programItem,
        startTime: dayjs(eventStartTime)
          .add(timeDifference, "hours")
          .toISOString(),
        endTime: dayjs(eventStartTime)
          .add(timeDifference, "hours")
          .add(programItem.mins, "minutes")
          .toISOString(),
      };
    }),
  );
};

const loadPastEventDataToDb = async (): Promise<void> => {
  initializeDayjs();
  await db.connectToDb();
  await updatePastEventProgramItems();

  // This will create default settings
  await findSettings();
  await addSignupQuestions();

  await db.gracefulExit();
};

loadPastEventDataToDb().catch((error: unknown) => {
  logger.error("%s", error);
});
