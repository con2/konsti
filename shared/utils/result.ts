interface SuccessResult<T> {
  ok: true;
  value: T;
}

interface ErrorResult<Err> {
  ok: false;
  error: Err;
}

export type Result<T, Err> = SuccessResult<T> | ErrorResult<Err>;

export const makeSuccessResult = <T>(
  value: T = undefined as T,
): SuccessResult<T> => ({
  ok: true,
  value,
});

export const makeErrorResult = <Err>(error: Err): ErrorResult<Err> => ({
  ok: false,
  error,
});
