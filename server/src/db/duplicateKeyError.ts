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
