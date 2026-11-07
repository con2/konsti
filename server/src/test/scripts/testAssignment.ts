import { addHours } from "date-fns";
import { config } from "shared/config";
import { AssignmentAlgorithm } from "shared/config/eventConfigTypes";
import { isEnumValue } from "shared/utils/isEnumValue";
import { db } from "server/db/mongodb";
import { runAssignment } from "server/features/assignment/run-assignment/runAssignment";
import { unsafelyUnwrap } from "server/test/utils/unsafelyUnwrapResult";
import { logger } from "server/utils/logger";

const testAssignment = async (
  assignmentAlgorithm: AssignmentAlgorithm,
): Promise<void> => {
  const assignmentTime = addHours(
    new Date(config.event().eventStartTime),
    3,
  ).toISOString();
  unsafelyUnwrap(
    await runAssignment({
      assignmentAlgorithm,
      assignmentTime,
    }),
  );
};

const getAssignmentAlgorithm = (userParameter: string): AssignmentAlgorithm => {
  const algorithms = Object.values(AssignmentAlgorithm);
  if (isEnumValue(AssignmentAlgorithm, userParameter)) {
    return userParameter;
  }
  // eslint-disable-next-line no-restricted-syntax -- Test script
  throw new Error(`Give valid algorithm parameter: ${algorithms.join(", ")}`);
};

const init = async (): Promise<void> => {
  if (process.env.NODE_ENV === "production") {
    // eslint-disable-next-line no-restricted-syntax -- Test script
    throw new Error("Attendee allocation not allowed in production");
  }

  const userParameter = process.argv[2];
  const assignmentAlgorithm = getAssignmentAlgorithm(userParameter);

  await db.connectToDb();
  await testAssignment(assignmentAlgorithm);
  await db.gracefulExit();
};

try {
  await init();
} catch (error: unknown) {
  logger.error(new Error("Failed to run test assignment", { cause: error }));
  process.exitCode = 1;
  await db.gracefulExit();
}
