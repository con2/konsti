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

export const saveUserSignupResults = async (
  startingTime: string,
  results: readonly AssignmentResult[]
): Promise<Result<void, MongoDbError>> => {
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

  // If user has previous directSignupAlwaysOpen signups...
  // ... and no new result -> don't remove
  // ... and new result -> remove
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

  const savePromises = results.map(async (result) => {
    const saveSignupResult = await saveSignup({
      username: result.username,
      enteredGameId: result.enteredGame.gameDetails.gameId,
      startTime: startingTime,
      message: result.enteredGame.message,
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

  return makeSuccessResult(undefined);
};
