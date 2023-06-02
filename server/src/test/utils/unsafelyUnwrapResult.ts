import { Result, isErrorResult } from "shared/utils/result";

// Use for tests and test data generation only!
export function unsafelyUnwrapResult<T, Err>(
  result: Result<T, Err>
): T | never {
  if (isErrorResult(result)) {
    // eslint-disable-next-line no-restricted-syntax -- Test helper
    throw new Error("Result did not contain a value!");
  } else {
    return result.value;
  }
}
