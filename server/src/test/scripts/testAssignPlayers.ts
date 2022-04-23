import moment from "moment";
import { logger } from "server/utils/logger";
import { runAssignment } from "server/features/player-assignment/runAssignment";
import { config } from "server/config";
import { saveResults } from "server/features/player-assignment/utils/saveResults";
import { removeOverlapSignups } from "server/features/player-assignment/utils/removeOverlapSignups";
import { verifyUserSignups } from "server/features/player-assignment/utils/verifyUserSignups";
import { verifyResults } from "server/features/player-assignment/utils/verifyResults";
import { db } from "server/db/mongodb";
import { AssignmentStrategy } from "shared/config/sharedConfig.types";
import { sharedConfig } from "shared/config/sharedConfig";

const testAssignPlayers = async (
  assignmentStrategy: AssignmentStrategy
): Promise<void> => {
  const { saveTestAssign, enableRemoveOverlapSignups } = config;
  const { CONVENTION_START_TIME } = sharedConfig;

  const startingTime = moment(CONVENTION_START_TIME).add(2, "hours").format();
  const assignResults = await runAssignment(startingTime, assignmentStrategy);

  if (!saveTestAssign) {
    return;
  }

  if (enableRemoveOverlapSignups) {
    await removeOverlapSignups(assignResults.results);
  }

  await saveResults(
    assignResults.results,
    startingTime,
    assignResults.algorithm,
    assignResults.message
  );

  await verifyResults();
  await verifyUserSignups();
};

const getAssignmentStrategy = (userParameter: string): AssignmentStrategy => {
  if (
    userParameter === AssignmentStrategy.MUNKRES ||
    userParameter === AssignmentStrategy.GROUP ||
    userParameter === AssignmentStrategy.PADG ||
    userParameter === AssignmentStrategy.GROUP_PADG
  ) {
    return userParameter;
  } else {
    throw new Error(
      'Give valid strategy parameter, possible: "munkres", "group", "padg", "group+padg"'
    );
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
