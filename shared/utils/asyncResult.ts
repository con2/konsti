interface SuccessResult<T> {
  value: T;
  error?: never;
}

interface ErrorResult<Err> {
  error: Err;
  value?: never;
}

export type AsyncResult<T, Err> = NonNullable<
  SuccessResult<T> | ErrorResult<Err>
>;

type UnwrapResult = <T, Err>(e: AsyncResult<T, Err>) => NonNullable<T | Err>;

// https://antman-does-software.com/stop-catching-errors-in-typescript-use-the-either-type-to-make-your-code-predictable
export const unwrapResult: UnwrapResult = <T, Err>({
  value,
  error,
}: AsyncResult<T, Err>) => {
  if (value !== undefined && error !== undefined) {
    throw new Error(
      `Received both value and error at runtime when opening an AsyncResult\nValue: ${JSON.stringify(
        value
      )}\nError: ${JSON.stringify(error)}`
    );
  }
  if (value !== undefined) {
    return value as NonNullable<T>;
  }
  if (error !== undefined) {
    return error as NonNullable<Err>; // Typescript is getting confused and returning this type as `T | undefined` unless we add the type assertion
  }
  throw new Error(`Received no value or error at runtime when opening Either`);
};

export const isSuccessResult = <T, Err>(
  result: AsyncResult<T, Err>
): result is SuccessResult<T> => {
  return result.value !== undefined;
};

export const isErrorResult = <T, Err>(
  result: AsyncResult<T, Err>
): result is ErrorResult<Err> => {
  return result.error !== undefined;
};

export const makeSuccessResult = <U>(value: U): SuccessResult<U> => ({
  value,
});

export const makeErrorResult = <Err>(error: Err): ErrorResult<Err> => ({
  error,
});
