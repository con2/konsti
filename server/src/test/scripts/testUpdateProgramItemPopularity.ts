import { db } from "server/db/mongodb";
import { updateProgramItemPopularity } from "server/features/program-item-popularity/updateProgramItemPopularity";
import { unsafelyUnwrap } from "server/test/utils/unsafelyUnwrapResult";
import { runScript } from "server/utils/runScript";

const testUpdateProgramItemPopularity = async (): Promise<void> => {
  await db.connectToDb();
  unsafelyUnwrap(await updateProgramItemPopularity());
};

await runScript(
  "Failed to update program item popularity",
  testUpdateProgramItemPopularity,
);
