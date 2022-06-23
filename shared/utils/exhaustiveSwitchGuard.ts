export const exhaustiveSwitchGuard = (_: never): never => {
  throw new Error("Exhaustive Switch Guard: Should never reach here");
};
