// A plain linear congruential generator: the values only have to be repeatable
// and spread out enough to shuffle a fixture list, not to be unpredictable.
//
// Math.imul, not `*`: the product overflows Number.MAX_SAFE_INTEGER, and the
// rounding that follows collapses the period to a few thousand coarsely
// spaced values, which is not a generator at all.
export const makeSeededRandom = (seed: number): (() => number) => {
  const modulus = 2 ** 32;
  let state = seed;
  return () => {
    state = (Math.imul(state, 1103515245) + 12345) >>> 0;
    return state / modulus;
  };
};

let installedState = 0;

const installedRandom = (): number => {
  installedState = (Math.imul(installedState, 1103515245) + 12345) >>> 0;
  return installedState / 2 ** 32;
};

// Replaces Math.random outright, for callers with no vitest mock to restore it.
//
// Reseeding resets this one function's state rather than assigning a new function: the
// assignment libraries capture Math.random when they load, so a replacement installed
// afterwards is never seen and a second seeding would leave them running on the first
// generator's advanced state. Two seeded replays in one process would then differ.
export const seedMathRandom = (seed = 1): void => {
  installedState = seed;
  Math.random = installedRandom;
};
