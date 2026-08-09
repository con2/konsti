import { describe, expect, test } from "vitest";
import {
  adminReducer,
  updateServerAppBuildTime,
} from "client/views/admin/adminSlice";
import { AdminState } from "client/types/reduxTypes";

const initialState = (): AdminState => adminReducer(undefined, { type: "" });

// Half the default 60 s poll interval, matching the confirmation window
const confirmWindowMs = 30_000;

const report = (
  state: AdminState,
  buildTime: string,
  receivedAt: number,
): AdminState =>
  adminReducer(state, updateServerAppBuildTime({ buildTime, receivedAt }));

describe("updateServerAppBuildTime", () => {
  test("confirms a build only after it stays the candidate for the confirmation window", () => {
    let state = report(initialState(), "1700000000", 0);
    expect(state.serverAppBuildTime).toEqual("");

    state = report(state, "1700000000", confirmWindowMs - 1);
    expect(state.serverAppBuildTime).toEqual("");

    state = report(state, "1700000000", confirmWindowMs);
    expect(state.serverAppBuildTime).toEqual("1700000000");
  });

  test("does not confirm a burst of polls from a single instant", () => {
    let state = report(initialState(), "2000", 0);
    state = report(state, "2000", 1000);
    state = report(state, "2000", 2000);
    expect(state.serverAppBuildTime).toEqual("");
  });

  test("alternating builds during a rolling deploy reset the window", () => {
    let state = initialState();
    state = report(state, "1000", 0);
    state = report(state, "2000", 60_000);
    state = report(state, "1000", 120_000);
    state = report(state, "2000", 180_000);
    expect(state.serverAppBuildTime).toEqual("");

    // Once the rollout settles, the next full poll interval confirms
    state = report(state, "2000", 240_000);
    expect(state.serverAppBuildTime).toEqual("2000");
  });

  test("keeps the confirmed build while a single differing poll arrives", () => {
    let state = initialState();
    state = report(state, "1700000000", 0);
    state = report(state, "1700000000", 60_000);
    expect(state.serverAppBuildTime).toEqual("1700000000");

    state = report(state, "1700000900", 120_000);
    expect(state.serverAppBuildTime).toEqual("1700000000");
  });

  test("confirms a redeploy of the same code, which carries a later build time", () => {
    let state = report(initialState(), "1700000000", 0);
    state = report(state, "1700000000", confirmWindowMs);
    expect(state.serverAppBuildTime).toEqual("1700000000");

    state = report(state, "1700000900", 60_000);
    state = report(state, "1700000900", 60_000 + confirmWindowMs);
    expect(state.serverAppBuildTime).toEqual("1700000900");
  });
});
