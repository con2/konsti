import { describe, expect, test } from "vitest";
import {
  adminReducer,
  updateServerAppVersion,
} from "client/views/admin/adminSlice";
import { AdminState } from "client/types/reduxTypes";

const initialState = (): AdminState => adminReducer(undefined, { type: "" });

// Half the default 60 s poll interval, matching the confirmation window
const confirmWindowMs = 30_000;

const report = (
  state: AdminState,
  version: string,
  receivedAt: number,
  buildTime = "1000",
): AdminState =>
  adminReducer(
    state,
    updateServerAppVersion({ version, buildTime, receivedAt }),
  );

describe("updateServerAppVersion", () => {
  test("confirms a version only after it stays the candidate for the confirmation window", () => {
    let state = report(initialState(), "abc123", 0);
    expect(state.serverAppVersion).toEqual("");

    state = report(state, "abc123", confirmWindowMs - 1);
    expect(state.serverAppVersion).toEqual("");

    state = report(state, "abc123", confirmWindowMs);
    expect(state.serverAppVersion).toEqual("abc123");
  });

  test("does not confirm a burst of polls from a single instant", () => {
    let state = report(initialState(), "new", 0);
    state = report(state, "new", 1000);
    state = report(state, "new", 2000);
    expect(state.serverAppVersion).toEqual("");
  });

  test("alternating versions during a rolling deploy reset the window", () => {
    let state = initialState();
    state = report(state, "old", 0);
    state = report(state, "new", 60_000);
    state = report(state, "old", 120_000);
    state = report(state, "new", 180_000);
    expect(state.serverAppVersion).toEqual("");

    // Once the rollout settles, the next full poll interval confirms
    state = report(state, "new", 240_000);
    expect(state.serverAppVersion).toEqual("new");
  });

  test("keeps the confirmed version while a single differing poll arrives", () => {
    let state = initialState();
    state = report(state, "abc123", 0);
    state = report(state, "abc123", 60_000);
    expect(state.serverAppVersion).toEqual("abc123");

    state = report(state, "def456", 120_000);
    expect(state.serverAppVersion).toEqual("abc123");
  });

  test("accepts the build time belonging to the version it confirms", () => {
    let state = report(initialState(), "abc123", 0, "1700000000");
    state = report(state, "abc123", confirmWindowMs, "1700000000");

    expect(state.serverAppVersion).toEqual("abc123");
    expect(state.serverAppBuildTime).toEqual("1700000000");
  });
});
