const DUPLICATE_KEY_ERROR_CODE = 11000;

// Mongo's duplicate key error: another caller created the document first.
// Matched structurally rather than with `instanceof MongoServerError`: Mongoose throws from its own
// bundled driver copy, which is a different class identity than the one a direct `mongodb` import
// resolves to
export const isDuplicateKeyError = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  error.code === DUPLICATE_KEY_ERROR_CODE;

// A bulk write collects per-operation failures instead of throwing on the first one, so it counts
// as a duplicate key error only when every operation that failed was one - an unrelated failure
// alongside them still has to be reported
export const isDuplicateKeyBulkWriteError = (error: unknown): boolean => {
  if (
    typeof error !== "object" ||
    error === null ||
    !("writeErrors" in error) ||
    !Array.isArray(error.writeErrors)
  ) {
    return isDuplicateKeyError(error);
  }

  return (
    error.writeErrors.length > 0 &&
    error.writeErrors.every((writeError) => isDuplicateKeyError(writeError))
  );
};
