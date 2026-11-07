import { db } from "server/db/mongodb";
import { verifyUserSignups } from "server/features/assignment/run-assignment/runAssignmentTestUtils";
import { unsafelyUnwrap } from "server/test/utils/unsafelyUnwrapResult";
import { runScript } from "server/utils/runScript";

const testVerifyResults = async (): Promise<void> => {
  await db.connectToDb();
  unsafelyUnwrap(await verifyUserSignups());
};

await runScript("Failed to verify results", testVerifyResults);
