interface SuccessResult<T> {
  kind: "success";
  value: T;
  error?: never;
}

interface ErrorResult<Err> {
  kind: "error";
  error: Err;
  value?: never;
}

export type AsyncResult<T, Err> = NonNullable<
  SuccessResult<T> | ErrorResult<Err>
>;

type UnwrapResult = <T, Err>(e: AsyncResult<T, Err>) => NonNullable<T | Err>;

// https://antman-does-software.com/stop-catching-errors-in-typescript-use-the-either-type-to-make-your-code-predictable
export const unwrapResult: UnwrapResult = <T, Err>({
  kind,
  value,
  error,
}: AsyncResult<T, Err>) => {
  if (kind !== "success" && kind !== "error") {
    throw new Error(
      `Invalid result kind: ${JSON.stringify(
        kind
      )}. Valid values are 'success' and 'error'.
      `
    );
  }
  if (kind === "success") {
    return value as NonNullable<T>;
  }
  if (kind === "error") {
    return error as NonNullable<Err>; // Typescript is getting confused and returning this type as `T | undefined` unless we add the type assertion
  }
  throw new Error(`Received no kind at runtime when opening Result`);
};

export const isSuccessResult = <T, Err>(
  result: AsyncResult<T, Err>
): result is SuccessResult<T> => {
  return result.kind === "success";
};

export const isErrorResult = <T, Err>(
  result: AsyncResult<T, Err>
): result is ErrorResult<Err> => {
  return result.kind === "error";
};

export const makeSuccessResult = <U>(value: U): SuccessResult<U> => ({
  kind: "success",
  value,
});

export const makeErrorResult = <Err>(error: Err): ErrorResult<Err> => ({
  kind: "error",
  error,
});
