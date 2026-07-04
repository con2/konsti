import { afterEach, describe, expect, test } from "vitest";
import { loadSession } from "client/utils/localStorage";
import { ProgramType } from "shared/types/models/programItem";

describe("loadSession", () => {
  afterEach(() => {
    localStorage.clear();
  });

  test("should load a valid session", () => {
    localStorage.setItem(
      "state",
      JSON.stringify({
        login: { jwt: "test-jwt" },
        admin: { activeProgramTypes: [ProgramType.TABLETOP_RPG] },
      }),
    );

    expect(loadSession()).toEqual({
      login: { jwt: "test-jwt" },
      admin: { activeProgramTypes: [ProgramType.TABLETOP_RPG] },
    });
  });

  test("should keep login and drop the filter when the saved filter has an outdated shape", () => {
    localStorage.setItem(
      "state",
      JSON.stringify({
        login: { jwt: "test-jwt" },
        // The pre-multi-select shape of the saved program type filter
        admin: { activeProgramType: ProgramType.LARP },
      }),
    );

    expect(loadSession()).toEqual({ login: { jwt: "test-jwt" } });
  });

  test("should clear the session when the value is not valid JSON", () => {
    localStorage.setItem("state", "not-json");

    expect(loadSession()).toBeUndefined();
    expect(localStorage.getItem("state")).toBeNull();
  });
});
