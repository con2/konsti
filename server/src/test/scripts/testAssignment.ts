import dayjs from "dayjs";
import { logger } from "server/utils/logger";
import { runAssignment } from "server/features/assignment/runAssignment";
import { db } from "server/db/mongodb";
import { AssignmentStrategy } from "shared/config/eventConfigTypes";
import { config } from "shared/config";

const testAssignment = async (
  assignmentStrategy: AssignmentStrategy,
): Promise<void> => {
  const startTime = dayjs(config.event().conventionStartTime)
    .add(3, "hours")
    .toISOString();
  await runAssignment({
    assignmentStrategy,
    startTime,
  });
};

const getAssignmentStrategy = (userParameter: string): AssignmentStrategy => {
  const strategies = Object.values(AssignmentStrategy);
  if (strategies.includes(userParameter as AssignmentStrategy)) {
    return userParameter as AssignmentStrategy;
  }
  // eslint-disable-next-line no-restricted-syntax -- Test script
  throw new Error(`Give valid strategy parameter: ${strategies.join(", ")}`);
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
  const assignmentStrategy = getAssignmentStrategy(userParameter);

  await db.connectToDb();
  await testAssignment(assignmentStrategy);
  await db.gracefulExit();
};

init().catch((error: unknown) => {
  logger.error("%s", error);
});
