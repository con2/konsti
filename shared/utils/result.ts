type NonUndefined<T> = Exclude<T, undefined>; // Remove undefined from T

interface SuccessResult<T> {
  value: T;
  error?: never;
}

interface ErrorResult<Err> {
  error: Err;
  value?: never;
}

export type Result<T, Err> = NonUndefined<SuccessResult<T> | ErrorResult<Err>>;

type UnwrapResult = <T, Err>(e: Result<T, Err>) => NonUndefined<T | Err>;

// https://antman-does-software.com/stop-catching-errors-in-typescript-use-the-either-type-to-make-your-code-predictable
export const unwrapResult: UnwrapResult = <T, Err>({
  value,
  error,
}: Result<T, Err>) => {
  if (value !== undefined && error !== undefined) {
    // eslint-disable-next-line no-restricted-syntax -- This is some kind of runtime error we want to catch
    throw new Error(
      `Received both value and error at runtime when opening an Result\nValue: ${JSON.stringify(
        value,
      )}\nError: ${JSON.stringify(error)}`,
    );
  }
  if (value !== undefined) {
    return value as NonUndefined<T>;
  }
  if (error !== undefined) {
    return error as NonUndefined<Err>; // Typescript is getting confused and returning this type as `T | undefined` unless we add the type assertion
  }
  // eslint-disable-next-line no-restricted-syntax -- This is some kind of runtime error we want to catch
  throw new Error(`Received no value or error at runtime when opening Result`);
};

export const isSuccessResult = <T, Err>(
  result: Result<T, Err>,
): result is SuccessResult<T> => {
  return result.value !== undefined;
};

export const isErrorResult = <T, Err>(
  result: Result<T, Err>,
): result is ErrorResult<Err> => {
  return result.error !== undefined;
};

export const makeSuccessResult = <U>(
  value: U = undefined as unknown as U,
): SuccessResult<U> => ({
  value,
});

export const makeErrorResult = <Err>(error: Err): ErrorResult<Err> => ({
  error,
});
