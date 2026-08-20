import fs from "node:fs";
import path from "node:path";
import { addHours, addMinutes } from "date-fns";
import { config } from "shared/config";
import { ProgramItem } from "shared/types/models/programItem";
import { db } from "server/db/mongodb";
import { saveProgramItems } from "server/features/program-item/programItemRepository";
import { addSignupQuestions } from "server/features/program-item/utils/addSignupQuestions";
import { findOrCreateSettings } from "server/features/settings/settingsRepository";
import { logger } from "server/utils/logger";

const updatePastEventProgramItems = async (): Promise<void> => {
  const { eventStartTime } = config.event();

  // Ropecon 2025 start time
  const oldStartTime = "2025-07-25T12:00:00Z";

  const rawData = fs.readFileSync(
    path.join(
      import.meta.dirname,
      "../../features/statistics/datafiles/ropecon/2025/program-items.json",
    ),
    "utf8",
  );

  const programItems = JSON.parse(rawData) as ProgramItem[];

  await saveProgramItems(
    programItems.map((programItem) => {
      // Fractional hours on purpose, so an item starting on a half hour keeps its
      // offset from the event start instead of being rounded onto the hour
      const timeDifference =
        (new Date(programItem.startTime).getTime() -
          new Date(oldStartTime).getTime()) /
        (60 * 60 * 1000);

      return {
        ...programItem,
        startTime: addHours(
          new Date(eventStartTime),
          timeDifference,
        ).toISOString(),
        endTime: addMinutes(
          addHours(new Date(eventStartTime), timeDifference),
          programItem.mins,
        ).toISOString(),
        parentId: programItem.parentId || programItem.programItemId,
      };
    }),
  );
};

const loadPastEventDataToDb = async (): Promise<void> => {
  await db.connectToDb();
  await updatePastEventProgramItems();

  // This will create default settings
  await findOrCreateSettings();
  await addSignupQuestions();

  await db.gracefulExit();
};

try {
  await loadPastEventDataToDb();
} catch (error: unknown) {
  logger.error(error);
}
