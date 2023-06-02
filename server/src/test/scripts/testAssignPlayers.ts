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
  const { saveTestAssign } = config;
  const { CONVENTION_START_TIME } = sharedConfig;

  const startingTime = dayjs(CONVENTION_START_TIME).add(2, "hours").format();
  await runAssignment({
    assignmentStrategy,
    startingTime,
  });

  if (!saveTestAssign) {
    return;
  }

  await verifyUserSignups();
};

const getAssignmentStrategy = (userParameter: string): AssignmentStrategy => {
  const strategies = Object.values(AssignmentStrategy);
  if (strategies.includes(userParameter as AssignmentStrategy)) {
    return userParameter as AssignmentStrategy;
  } else {
    // eslint-disable-next-line no-restricted-syntax -- Test script
    throw new Error(`Give valid strategy parameter: ${strategies.join(", ")}`);
  }
};

const init = async (): Promise<void> => {
  if (process.env.NODE_ENV === "production") {
    logger.error(`Player allocation not allowed in production`);
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
