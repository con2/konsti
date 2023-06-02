import { AssignmentResult } from "shared/typings/models/result";
import {
  delSignup,
  delRpgSignupsByStartTime,
  findRpgSignupsByStartTime,
  saveSignup,
} from "server/features/signup/signupRepository";
import {
  AsyncResult,
  isErrorResult,
  makeErrorResult,
  makeSuccessResult,
  unwrapResult,
} from "shared/utils/asyncResult";
import { MongoDbError } from "shared/typings/api/errors";

export const saveUserSignupResults = async (
  startingTime: string,
  results: readonly AssignmentResult[]
): Promise<AsyncResult<void, MongoDbError>> => {
  const delRpgSignupsByStartTimeAsyncResult = await delRpgSignupsByStartTime(
    startingTime
  );
  if (isErrorResult(delRpgSignupsByStartTimeAsyncResult)) {
    return delRpgSignupsByStartTimeAsyncResult;
  }

  // Only directSignupAlwaysOpen signups should be remaining
  const rpgSignupsByStartTimeAsyncResult = await findRpgSignupsByStartTime(
    startingTime
  );
  if (isErrorResult(rpgSignupsByStartTimeAsyncResult)) {
    return rpgSignupsByStartTimeAsyncResult;
  }

  const rpgSignupsByStartTime = unwrapResult(rpgSignupsByStartTimeAsyncResult);

  // If user has previous directSignupAlwaysOpen signups...
  // ... and no new result -> don't remove
  // ... and new result -> remove
  const deletePromises = results.map(async (result) => {
    const existingSignup = rpgSignupsByStartTime.find(
      (signup) => signup.username === result.username
    );

    if (existingSignup) {
      const delSignupAsyncResult = await delSignup({
        username: existingSignup.username,
        enteredGameId: existingSignup.gameId,
        startTime: existingSignup.time,
      });
      if (isErrorResult(delSignupAsyncResult)) {
        return delSignupAsyncResult;
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

  const savePromises = results.map(async (result) => {
    const saveSignupAsyncResult = await saveSignup({
      username: result.username,
      enteredGameId: result.enteredGame.gameDetails.gameId,
      startTime: startingTime,
      message: result.enteredGame.message,
    });
    if (isErrorResult(saveSignupAsyncResult)) {
      return saveSignupAsyncResult;
    }
    const saveSignupResult = unwrapResult(saveSignupAsyncResult);
    return makeSuccessResult(saveSignupResult);
  });

  const saveResults = await Promise.all(savePromises);
  const someSaveFailed = saveResults.some((saveResult) =>
    isErrorResult(saveResult)
  );
  if (someSaveFailed) {
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }

  return makeSuccessResult(undefined);
};
