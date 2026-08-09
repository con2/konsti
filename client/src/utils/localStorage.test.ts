import { afterEach, describe, expect, test } from "vitest";
import { clearSession, loadSession } from "client/utils/localStorage";
import { resetStaleEventStorage } from "client/utils/resetStaleEventStorage";
import { ProgramType } from "shared/types/models/programItem";
import {
  appUpdateReloadedBuildTimeKey,
  browserStoragePrefix,
  localStorageStateKey,
} from "shared/constants/browserStorage";

afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe("loadSession", () => {
  test("should load a valid session", () => {
    localStorage.setItem(
      localStorageStateKey,
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

  test("should clear the session when the value is not valid JSON", () => {
    localStorage.setItem(localStorageStateKey, "not-json");

    expect(loadSession()).toBeUndefined();
    expect(localStorage.getItem(localStorageStateKey)).toBeNull();
  });
});

describe("clearSession", () => {
  test("should drop this event's session keys but keep the update reload guard", () => {
    const searchTermKey = `${browserStoragePrefix}-allProgramItemsSearchTerm`;

    localStorage.setItem(localStorageStateKey, "session");
    sessionStorage.setItem(searchTermKey, "dragons");
    sessionStorage.setItem(appUpdateReloadedBuildTimeKey, "1700000000");
    sessionStorage.setItem("unrelated", "keep");

    clearSession();

    expect(localStorage.getItem(localStorageStateKey)).toBeNull();
    expect(sessionStorage.getItem(searchTermKey)).toBeNull();
    // Logging out is a navigation, so losing this would allow a second
    // automatic reload for a version already tried
    expect(sessionStorage.getItem(appUpdateReloadedBuildTimeKey)).toBe(
      "1700000000",
    );
    expect(sessionStorage.getItem("unrelated")).toBe("keep");
  });
});

describe("resetStaleEventStorage", () => {
  test("should remove previous events' keys but keep current event and unrelated keys", () => {
    const currentKey = `${browserStoragePrefix}-allProgramItemsSearchTerm`;

    localStorage.setItem("konsti-OtherCon-1999-state", "stale");
    localStorage.setItem(localStorageStateKey, "current");
    localStorage.setItem("i18nextLng", "fi");
    sessionStorage.setItem("konsti-OtherCon-1999-allProgramItemsTag", "stale");
    sessionStorage.setItem(currentKey, "current");

    resetStaleEventStorage();

    expect(localStorage.getItem("konsti-OtherCon-1999-state")).toBeNull();
    expect(localStorage.getItem(localStorageStateKey)).toBe("current");
    expect(localStorage.getItem("i18nextLng")).toBe("fi");
    expect(
      sessionStorage.getItem("konsti-OtherCon-1999-allProgramItemsTag"),
    ).toBeNull();
    expect(sessionStorage.getItem(currentKey)).toBe("current");
  });
});
