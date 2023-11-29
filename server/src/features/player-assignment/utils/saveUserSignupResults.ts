import dayjs from "dayjs";
import { AssignmentResult } from "shared/types/models/result";
import {
  delSignup,
  delAssignmentSignupsByStartTime,
  findSignupsByProgramTypes,
  saveSignups,
} from "server/features/signup/signupRepository";
import {
  Result,
  isErrorResult,
  makeErrorResult,
  makeSuccessResult,
  unwrapResult,
} from "shared/utils/result";
import { MongoDbError } from "shared/types/api/errors";
import {
  addEventLogItems,
  deleteEventLogItemsByStartTime,
} from "server/features/user/event-log/eventLogRepository";
import { EventLogAction } from "shared/types/models/eventLog";
import { config } from "shared/config";

export const saveUserSignupResults = async (
  startTime: string,
  results: readonly AssignmentResult[],
): Promise<Result<void, MongoDbError>> => {
  // Remove previous assignment result for the same start time
  // This does not remove "directSignupAlwaysOpen" signups or previous signups from moved program items
  const delAssignmentSignupsByStartTimeResult =
    await delAssignmentSignupsByStartTime(startTime);
  if (isErrorResult(delAssignmentSignupsByStartTimeResult)) {
    return delAssignmentSignupsByStartTimeResult;
  }

  // Only "directSignupAlwaysOpen" signups and previous signups from moved program items should be remaining
  const twoPhaseSignupsByStartTimeResult = await findSignupsByProgramTypes(
    config.shared().twoPhaseSignupProgramTypes,
    startTime,
  );
  if (isErrorResult(twoPhaseSignupsByStartTimeResult)) {
    return twoPhaseSignupsByStartTimeResult;
  }
  const twoPhaseSignupsByStartTime = unwrapResult(
    twoPhaseSignupsByStartTimeResult,
  );

  // Resolve conflicting existing signups
  // If user has existing signups...
  // ... and new assignment result -> remove existing
  // ... and no new assignment result -> keep existing
  const deletePromises = results.map(async (result) => {
    const existingSignup = twoPhaseSignupsByStartTime.find(
      (signup) => signup.username === result.username,
    );

    if (existingSignup) {
      const delSignupResult = await delSignup({
        username: existingSignup.username,
        enteredGameId: existingSignup.gameId,
        startTime: existingSignup.time,
      });
      if (isErrorResult(delSignupResult)) {
        return delSignupResult;
      }
    }
    return makeSuccessResult(undefined);
  });

  const deleteResults = await Promise.all(deletePromises);
  const someDeleteFailed = deleteResults.some((deleteResult) =>
    isErrorResult(deleteResult),
  );
  if (someDeleteFailed) {
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }

  // Save new assignment results
  const newSignups = results.map((result) => {
    return {
      username: result.username,
      enteredGameId: result.enteredGame.gameDetails.gameId,
      startTime,
      message: result.enteredGame.message,
      priority: result.enteredGame.priority,
    };
  });

  // This might drop some signups if by some error too many signups are passed for a program item
  const saveSignupsResult = await saveSignups(newSignups);
  if (isErrorResult(saveSignupsResult)) {
    return saveSignupsResult;
  }
  const { droppedSignups } = unwrapResult(saveSignupsResult);

  // Remove eventLog items from same start time
  const deleteEventLogItemsByStartTimeResult =
    await deleteEventLogItemsByStartTime(
      startTime,
      EventLogAction.NEW_ASSIGNMENT,
    );
  if (isErrorResult(deleteEventLogItemsByStartTimeResult)) {
    return deleteEventLogItemsByStartTimeResult;
  }

  // Filter out possible dropped results
  const finalResults =
    droppedSignups.length > 0
      ? results.filter((result) => {
          return droppedSignups.find(
            (signup) =>
              !(
                signup.enteredGameId ===
                  result.enteredGame.gameDetails.gameId &&
                signup.username === result.username
              ),
          );
        })
      : results;

  // Add new signups to users eventLogs
  const addEventLogItemsResult = await addEventLogItems({
    updates: finalResults.map((result) => ({
      username: result.username,
      programItemId: result.enteredGame.gameDetails.gameId,
      programItemStartTime: startTime,
      createdAt: dayjs().toISOString(),
    })),
    action: EventLogAction.NEW_ASSIGNMENT,
  });
  if (isErrorResult(addEventLogItemsResult)) {
    return addEventLogItemsResult;
  }

  return makeSuccessResult(undefined);
};
