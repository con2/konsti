import dayjs from "dayjs";
import { logger } from "server/utils/logger";
import { runAssignment } from "server/features/player-assignment/runAssignment";
import { config } from "server/config";
import { verifyUserSignups } from "server/features/player-assignment/utils/verifyUserSignups";
import { db } from "server/db/mongodb";
import { AssignmentStrategy } from "shared/config/sharedConfig.types";
import { sharedConfig } from "shared/config/sharedConfig";

const testAssignPlayers = async (
  assignmentStrategy: AssignmentStrategy
): Promise<void> => {
  const startingTime = dayjs(sharedConfig.CONVENTION_START_TIME)
    .add(2, "hours")
    .toISOString();
  await runAssignment({
    assignmentStrategy,
    startingTime,
  });

  if (!config.saveTestAssign) {
    return;
  }

  await verifyUserSignups();
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
      new Error("Player allocation not allowed in production")
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
