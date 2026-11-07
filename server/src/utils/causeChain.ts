interface CauseChain {
  errors: Error[];
  nonErrorCause: unknown;
}

// Stops at the first repeated Error, since a cause chain can loop back on itself
export const getCauseChain = (error: Error): CauseChain => {
  const errors = [error];
  let cause = error.cause;
  while (cause instanceof Error && !errors.includes(cause)) {
    errors.push(cause);
    cause = cause.cause;
  }
  return {
    errors,
    nonErrorCause: cause instanceof Error ? undefined : cause,
  };
};
