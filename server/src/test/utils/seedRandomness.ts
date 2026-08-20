import { faker } from "@faker-js/faker";
import { vi } from "vitest";

// The assignment tests assert fixed result counts, but both the fixtures and the
// algorithms draw from randomness: generateTestData through faker and n(), the
// PADG list order through Math.random, and remeda's shuffle through it too. With
// none of it pinned the assertions run against different input every time, so
// they fail a small percentage of runs and cannot be reproduced locally.
//
// Anything that has to stay unique per test must not come from faker, or seeding
// makes every test draw the same value - which is why the database names use
// randomUUID(). `vi.restoreAllMocks` in afterEach puts Math.random back.
export const seedRandomness = (seed = 1): void => {
  faker.seed(seed);

  // A plain linear congruential generator: the values only have to be repeatable
  // and spread out enough to shuffle a fixture list, not to be unpredictable
  const modulus = 2 ** 31;
  let state = seed;
  vi.spyOn(Math, "random").mockImplementation(() => {
    state = (state * 1103515245 + 12345) % modulus;
    return state / modulus;
  });
};
