// The signup confirm button is disabled while a signup request is in flight, or while an
// entry condition (e.g. K16, entry fee) exists but has not been agreed to
export const isSignupConfirmDisabled = (
  hasEntryCondition: boolean,
  agreeEntryCondition: boolean,
  loading: boolean,
): boolean => (hasEntryCondition && !agreeEntryCondition) || loading;
