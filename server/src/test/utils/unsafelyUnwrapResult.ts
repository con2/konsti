import { Result } from "shared/utils/result";

// Use for tests and test data generation only!
export function unsafelyUnwrap<T, Err>(result: Result<T, Err>): T | never {
  if (!result.ok) {
    // eslint-disable-next-line no-restricted-syntax -- Test helper
    throw new Error("Result did not contain a value!");
  }
  return result.value;
}
