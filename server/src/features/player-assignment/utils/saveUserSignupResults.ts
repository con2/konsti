import dayjs from "dayjs";
import { AssignmentResult } from "shared/typings/models/result";
import {
  delSignup,
  delRpgSignupsByStartTime,
  findRpgSignupsByStartTime,
  saveSignup,
} from "server/features/signup/signupRepository";
import {
  Result,
  isErrorResult,
  makeErrorResult,
  makeSuccessResult,
  unwrapResult,
} from "shared/utils/result";
import { MongoDbError } from "shared/typings/api/errors";
import {
  addEventLogItems,
  deleteEventLogItemsByStartTime,
} from "server/features/user/event-log/eventLogRepository";
import { EventLogAction } from "shared/typings/models/eventLog";

export const saveUserSignupResults = async (
  startingTime: string,
  results: readonly AssignmentResult[]
): Promise<Result<void, MongoDbError>> => {
  // Remove previous assignment result - for now only RPGs use assignment
  // This does not remove directSignupAlwaysOpen signups as they are not assignment results
  const delRpgSignupsByStartTimeResult = await delRpgSignupsByStartTime(
    startingTime
  );
  if (isErrorResult(delRpgSignupsByStartTimeResult)) {
    return delRpgSignupsByStartTimeResult;
  }

  // Only directSignupAlwaysOpen signups should be remaining
  const rpgSignupsByStartTimeResult = await findRpgSignupsByStartTime(
    startingTime
  );
  if (isErrorResult(rpgSignupsByStartTimeResult)) {
    return rpgSignupsByStartTimeResult;
  }

  const rpgSignupsByStartTime = unwrapResult(rpgSignupsByStartTimeResult);

  // Resolve conflicting directSignupAlwaysOpen signups
  // If user has previous directSignupAlwaysOpen signups...
  // ... and new assignment result -> remove
  // ... and no new assignment result -> do not remove
  const deletePromises = results.map(async (result) => {
    const existingSignup = rpgSignupsByStartTime.find(
      (signup) => signup.username === result.username
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
    isErrorResult(deleteResult)
  );
  if (someDeleteFailed) {
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }

  // Save new assignment results
  const savePromises = results.map(async (result) => {
    const saveSignupResult = await saveSignup({
      username: result.username,
      enteredGameId: result.enteredGame.gameDetails.gameId,
      startTime: startingTime,
      message: result.enteredGame.message,
      priority: result.enteredGame.priority,
    });
    if (isErrorResult(saveSignupResult)) {
      return saveSignupResult;
    }
    const saveSignupResponse = unwrapResult(saveSignupResult);
    return makeSuccessResult(saveSignupResponse);
  });

  const saveResults = await Promise.all(savePromises);
  const someSaveFailed = saveResults.some((saveResult) =>
    isErrorResult(saveResult)
  );
  if (someSaveFailed) {
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }

  // Remove eventLog items from same starting time
  const deleteEventLogItemsByStartTimeResult =
    await deleteEventLogItemsByStartTime(
      startingTime,
      EventLogAction.NEW_ASSIGNMENT
    );
  if (isErrorResult(deleteEventLogItemsByStartTimeResult)) {
    return deleteEventLogItemsByStartTimeResult;
  }

  // Add new signups to users eventLogs
  const addEventLogItemsResult = await addEventLogItems({
    updates: results.map((result) => ({
      username: result.username,
      programItemId: result.enteredGame.gameDetails.gameId,
      programItemStartTime: startingTime,
      createdAt: dayjs().toISOString(),
    })),
    action: EventLogAction.NEW_ASSIGNMENT,
  });
  if (isErrorResult(addEventLogItemsResult)) {
    return addEventLogItemsResult;
  }

  return makeSuccessResult(undefined);
};
