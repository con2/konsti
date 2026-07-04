import { config } from "shared/config";

// Every Konsti browser storage key carries this event-specific prefix, so
// data saved by a previous event's Konsti on the same domain is never read
// and storage shape changes between events need no migrations (matching the
// server DB lifecycle). resetStaleEventStorage() removes old events' keys
// on page load
export const browserStoragePrefix = `konsti-${config.event().eventName}-${config.event().eventYear}`;

// The localStorage key holding the persisted session (JWT + saved
// preferences). Also written directly by the Playwright login helper
export const localStorageStateKey = `${browserStoragePrefix}-state`;
