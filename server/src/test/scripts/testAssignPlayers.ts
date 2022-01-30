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

  let assignResults;

  const startingTime = moment(CONVENTION_START_TIME).add(2, "hours").format();

  try {
    assignResults = await runAssignment(startingTime, assignmentStrategy);
  } catch (error) {
    logger.error(error);
    return;
  }

  if (saveTestAssign) {
    if (enableRemoveOverlapSignups) {
      try {
        await removeOverlapSignups(assignResults.results);
      } catch (error) {
        logger.error(error);
        return;
      }
    }

    try {
      await saveResults(
        assignResults.results,
        startingTime,
        assignResults.algorithm,
        assignResults.message
      );
    } catch (error) {
      logger.error(error);
      return;
    }

    await verifyResults();

    await verifyUserSignups();
  }
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

  let assignmentStrategy;
  try {
    assignmentStrategy = getAssignmentStrategy(userParameter);
  } catch (error) {
    logger.error(error);
    return;
  }

  try {
    await db.connectToDb();
  } catch (error) {
    logger.error(error);
    throw new Error(error);
  }

  await testAssignPlayers(assignmentStrategy);

  try {
    await db.gracefulExit();
  } catch (error) {
    logger.error(error);
  }
};

init().catch((error) => {
  logger.error(error);
});
