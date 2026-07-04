import { browserStoragePrefix } from "shared/constants/browserStorage";

// Konsti storage keys are prefixed with the event+year (browserStoragePrefix),
// so a new event never reads a previous event's data; this removes the
// leftover keys on page load
export const resetStaleEventStorage = (): void => {
  for (const storage of [localStorage, sessionStorage]) {
    const staleKeys = Object.keys(storage).filter(
      (key) =>
        key.startsWith("konsti-") &&
        !key.startsWith(`${browserStoragePrefix}-`),
    );
    for (const staleKey of staleKeys) {
      storage.removeItem(staleKey);
    }
  }
};
