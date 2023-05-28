import { AsyncResult, isErrorResult } from "shared/utils/asyncResult";

// Use for tests and test data generation only!
export function unsafelyUnfurlAsyncResult<T, Err>(
  result: AsyncResult<T, Err>
): T | never {
  if (isErrorResult(result)) {
    throw new Error("Result did not contain a value!");
  } else {
    return result.value;
  }
}
