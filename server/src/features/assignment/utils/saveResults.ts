import { AssignmentAlgorithm } from "shared/config/eventConfigTypes";
import { MongoDbError } from "shared/types/api/errors";
import { ProgramItem } from "shared/types/models/programItem";
import { UserAssignmentResult } from "shared/types/models/result";
import { User } from "shared/types/models/user";
import { Result, makeSuccessResult } from "shared/utils/result";
import { addAssignmentNotifications } from "server/features/assignment/utils/addAssignmentNotifications";
import { getAssignmentResultGroups } from "server/features/assignment/utils/getAssignmentResultGroups";
import { saveUserSignupResults } from "server/features/assignment/utils/saveUserSignupResults";
import {
  saveLotteryRanForStartTime,
  savePassedOverForLottery,
} from "server/features/program-item/programItemRepository";
import { saveResult } from "server/features/results/resultsRepository";
import { logger } from "server/utils/logger";

interface SaveResultsParams {
  results: readonly UserAssignmentResult[];
  assignmentTime: string;
  algorithm: AssignmentAlgorithm;
  message: string;
  users: User[];
  programItems: ProgramItem[];
  lotteriedProgramItemIds: readonly string[];
  passedOverProgramItemIds: readonly string[];
}

// The writes below run in order of how much rides on them: the spots first, then the mark that
// closes this start time's lottery, then the record-keeping and the messages, neither of which
// can cost anybody a spot by failing
export const saveResults = async ({
  results,
  assignmentTime,
  algorithm,
  message,
  users,
  programItems,
  lotteriedProgramItemIds,
  passedOverProgramItemIds,
  // Returns the results that actually landed, so the caller acts on those rather than on what
  // the algorithm proposed
}: SaveResultsParams): Promise<
  Result<readonly UserAssignmentResult[], MongoDbError>
> => {
  // The lottery runs on a timer, so most runs reach a start time with nothing to do at all
  if (
    lotteriedProgramItemIds.length === 0 &&
    passedOverProgramItemIds.length === 0
  ) {
    logger.info(
      `Assignment ${assignmentTime}: nothing was lotteried, nothing to save`,
    );
    return makeSuccessResult([]);
  }

  logger.info(`Save user signup results for assignment time ${assignmentTime}`);
  const saveUserSignupResultsResult = await saveUserSignupResults({
    assignmentTime,
    results,
    users,
    programItems,
  });
  if (!saveUserSignupResultsResult.ok) {
    return saveUserSignupResultsResult;
  }
  const finalResults = saveUserSignupResultsResult.value;

  // The program items that went through the lottery, placed or not: their lottery has happened.
  // Written only once the spots exist, because nothing clears the mark - marking before a
  // failed save would strand them out of the lottery with nobody placed
  const saveLotteryRanResult = await saveLotteryRanForStartTime(
    lotteriedProgramItemIds,
    assignmentTime,
  );
  if (!saveLotteryRanResult.ok) {
    // The spots are saved, so returning here would cost the winners their notifications over
    // a mark that only bookkeeping needs
    logger.error(
      new Error(
        `Assignment ${assignmentTime}: failed to mark the lotteried program items: ${saveLotteryRanResult.error}`,
      ),
    );
  }

  const savePassedOverResult = await savePassedOverForLottery(
    passedOverProgramItemIds,
  );
  if (!savePassedOverResult.ok) {
    logger.error(
      new Error(
        `Assignment ${assignmentTime}: failed to record the passed over program items: ${savePassedOverResult.error}`,
      ),
    );
  }

  // The spots are saved at this point, so nothing below can fail the run - it logs and carries on
  await addAssignmentNotifications({
    assignmentTime,
    finalResults,
    users,
    programItems,
  });

  // Recorded only when a program item actually went through a lottery. A run that skipped
  // every one of them decided nothing, and a record for it would read as a lottery that ran
  if (lotteriedProgramItemIds.length > 0) {
    await storeResultsSnapshot({
      results: finalResults,
      assignmentTime,
      algorithm,
      message,
      users,
      programItems,
    });
  }

  return makeSuccessResult(finalResults);
};

interface StoreResultsSnapshotParams {
  results: readonly UserAssignmentResult[];
  assignmentTime: string;
  algorithm: AssignmentAlgorithm;
  message: string;
  users: User[];
  programItems: ProgramItem[];
}

const storeResultsSnapshot = async ({
  results,
  assignmentTime,
  algorithm,
  message,
  users,
  programItems,
}: StoreResultsSnapshotParams): Promise<void> => {
  logger.info(
    `Save all signup results to separate collection for assignment time ${assignmentTime}`,
  );

  // Snapshot the groups as they were when this lottery ran
  const groups = getAssignmentResultGroups(users, programItems, assignmentTime);

  const saveResultResult = await saveResult(
    results,
    groups,
    assignmentTime,
    algorithm,
    message,
  );
  if (!saveResultResult.ok) {
    logger.error(
      new Error(
        `Assignment ${assignmentTime}: failed to store the results snapshot: ${saveResultResult.error}`,
      ),
    );
  }
};
