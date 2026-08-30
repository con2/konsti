import { onPageResume } from "client/utils/pageLifecycle";

// Everything the current time is compared against - sign-up windows above all -
// is minute-granular, and the data it is compared against is refetched about
// this often anyway, so a finer tick would only re-render for no visible change
const CLOCK_TICK_MS = 60 * 1000;

// One instant shared by every consumer, replaced only on a tick. Reading the
// clock while rendering would be impure: React has nothing to key a cached
// value on, so a component keeps whichever instant it first rendered with.
// Ticking also keeps the value stable in between, so consumers can list it as
// a dependency like any other value. Kept as epoch milliseconds rather than a
// Date object so that an unchanged instant compares equal instead of merely equivalent.
let timeNowMs = Date.now();
const listeners = new Set<() => void>();
let clockTimer: ReturnType<typeof setTimeout> | undefined;
let stopListeningForPageResume: (() => void) | undefined;

const advanceClock = (): void => {
  const now = Date.now();
  if (now === timeNowMs) {
    return;
  }
  timeNowMs = now;
  for (const listener of listeners) {
    listener();
  }
};

// Ticks land on wall-clock minute boundaries rather than on whatever phase the
// page happened to load at. A sign-up window opening at 18:15 therefore opens
// at the same moment for everyone, instead of up to a full tick later for
// whoever loaded at an unlucky offset - which for first-come-first-served
// sign-ups is the difference between a spot and no spot.
const scheduleTick = (): void => {
  clockTimer = setTimeout(
    () => {
      advanceClock();
      scheduleTick();
    },
    CLOCK_TICK_MS - (Date.now() % CLOCK_TICK_MS),
  );
};

// A frozen page (screen off, background tab) runs no timers, so on resume the
// app can render freshly polled data against an instant from before the sleep.
// The same applies after any spell with no subscribers. Only acts on a gap
// worth a tick, so subscribing right after the module loaded doesn't hand
// every consumer a second, pointlessly different instant to re-render for.
const catchUpClock = (): void => {
  if (Date.now() - timeNowMs >= CLOCK_TICK_MS) {
    advanceClock();
  }
};

// The subscribe half of a store for useSyncExternalStore. The timer only runs
// while something is subscribed, so an app that never reads the clock doesn't
// wake the page for it.
export const subscribeToClock = (listener: () => void): (() => void) => {
  if (listeners.size === 0) {
    catchUpClock();
    scheduleTick();
    stopListeningForPageResume = onPageResume(catchUpClock);
  }
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      clearTimeout(clockTimer);
      clockTimer = undefined;
      stopListeningForPageResume?.();
      stopListeningForPageResume = undefined;
    }
  };
};

// Must keep returning the same value until the clock ticks: React re-reads it
// after every render and re-renders again whenever it changed
export const getTimeNowSnapshot = (): number => timeNowMs;
