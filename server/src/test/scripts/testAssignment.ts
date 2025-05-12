import dayjs from "dayjs";
import { logger } from "server/utils/logger";
import { runAssignment } from "server/features/assignment/run-assignment/runAssignment";
import { db } from "server/db/mongodb";
import { AssignmentAlgorithm } from "shared/config/eventConfigTypes";
import { config } from "shared/config";

const testAssignment = async (
  assignmentAlgorithm: AssignmentAlgorithm,
): Promise<void> => {
  const assignmentTime = dayjs(config.event().eventStartTime)
    .add(3, "hours")
    .toISOString();
  await runAssignment({
    assignmentAlgorithm,
    assignmentTime,
  });
};

const getAssignmentAlgorithm = (userParameter: string): AssignmentAlgorithm => {
  const algorithms = Object.values(AssignmentAlgorithm);
  if (algorithms.includes(userParameter as AssignmentAlgorithm)) {
    return userParameter as AssignmentAlgorithm;
  }
  // eslint-disable-next-line no-restricted-syntax -- Test script
  throw new Error(`Give valid algorithm parameter: ${algorithms.join(", ")}`);
};

const init = async (): Promise<void> => {
  if (process.env.NODE_ENV === "production") {
    logger.error(
      "%s",
      new Error("Attendee allocation not allowed in production"),
    );
    return;
  }

  const userParameter = process.argv[2];
  const assignmentAlgorithm = getAssignmentAlgorithm(userParameter);

  await db.connectToDb();
  await testAssignment(assignmentAlgorithm);
  await db.gracefulExit();
};

init().catch((error: unknown) => {
  logger.error("%s", error);
});
