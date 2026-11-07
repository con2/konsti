import { db } from "server/db/mongodb";
import { removeCancelledDeletedProgramItemsFromUsers } from "server/features/assignment/utils/removeInvalidProgramItemsFromUsers";
import { findProgramItems } from "server/features/program-item/programItemRepository";
import { unsafelyUnwrap } from "server/test/utils/unsafelyUnwrapResult";
import { logger } from "server/utils/logger";

const removeInvalidProgramItems = async (): Promise<void> => {
  await db.connectToDb();

  const programItems = unsafelyUnwrap(await findProgramItems());
  unsafelyUnwrap(
    await removeCancelledDeletedProgramItemsFromUsers({
      programItems,
      currentProgramItems: [],
      notifyAffectedDirectSignups: [],
      notify: false,
    }),
  );

  await db.gracefulExit();
};

try {
  await removeInvalidProgramItems();
} catch (error: unknown) {
  logger.error(
    new Error("Failed to remove invalid program items", { cause: error }),
  );
  process.exitCode = 1;
  await db.gracefulExit();
}
