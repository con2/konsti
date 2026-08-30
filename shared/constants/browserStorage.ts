import { config } from "shared/config";

// Every Konsti browser storage key carries this event-specific prefix, so
// data saved by a previous event's Konsti on the same domain is never read
// and storage shape changes between events need no migrations (matching the
// server DB lifecycle). resetStaleEventStorage() removes old events' keys
// on page load
export const browserStorageEventPrefix = `konsti-${config.event().eventName}-${config.event().eventYear}`;

// The localStorage key holding the persisted session (JWT + saved
// preferences). Also written directly by the Playwright login helper.
export const localStorageStateKey = `${browserStorageEventPrefix}-state`;

// The sessionStorage key guarding against repeated automatic update reloads.
// Defined here rather than with the other session keys because clearing the
// session has to preserve it, and importing that module there would be a cycle.
export const appUpdateReloadedBuildTimeKey = `${browserStorageEventPrefix}-appUpdateReloadedBuildTime`;

// The sessionStorage key holding the OAuth state of an in-progress Kompassi
// login. Here for the same reason: clearing the session has to preserve it, or
// a logout would abandon a login started moments earlier. Session-scoped so
// each tab checks the state it started its own login with.
export const kompassiLoginStateKey = `${browserStorageEventPrefix}-kompassiLoginState`;
