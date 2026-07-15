// The signup confirm button is disabled while an entry condition
// (e.g. K16, entry fee) exists but has not been agreed to
export const isSignupConfirmDisabled = (
  hasEntryCondition: boolean,
  agreeEntryCondition: boolean,
): boolean => hasEntryCondition && !agreeEntryCondition;
