export const exhaustiveSwitchGuard = (_: never): never => {
  // eslint-disable-next-line no-restricted-syntax -- Utility
  throw new Error("Exhaustive Switch Guard: Should never reach here");
};
