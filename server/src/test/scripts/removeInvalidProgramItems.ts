import { db } from "server/db/mongodb";
import { removeCancelledDeletedProgramItemsFromUsers } from "server/features/assignment/utils/removeInvalidProgramItemsFromUsers";
import { findProgramItems } from "server/features/program-item/programItemRepository";
import { unsafelyUnwrap } from "server/test/utils/unsafelyUnwrapResult";
import { runScript } from "server/utils/runScript";

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
};

await runScript(
  "Failed to remove invalid program items",
  removeInvalidProgramItems,
);
