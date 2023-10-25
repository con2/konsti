import dayjs from "dayjs";
import { logger } from "server/utils/logger";
import { runAssignment } from "server/features/player-assignment/runAssignment";
import { db } from "server/db/mongodb";
import { AssignmentStrategy } from "shared/config/sharedConfigTypes";
import { getSharedConfig } from "shared/config/sharedConfig";

const testAssignPlayers = async (
  assignmentStrategy: AssignmentStrategy,
): Promise<void> => {
  const startTime = dayjs(getSharedConfig().CONVENTION_START_TIME)
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
      new Error("Player allocation not allowed in production"),
    );
    return;
  }

  const userParameter = process.argv[2];
  const assignmentStrategy = getAssignmentStrategy(userParameter);

  await db.connectToDb();
  await testAssignPlayers(assignmentStrategy);
  await db.gracefulExit();
};

init().catch((error) => {
  logger.error(error);
});
