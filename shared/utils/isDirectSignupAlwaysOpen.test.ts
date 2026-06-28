import { beforeEach, describe, expect, test, vi } from "vitest";
import { config } from "shared/config";
import { Tag } from "shared/types/models/programItem";
import { testProgramItem } from "shared/tests/testProgramItem";
import { isDirectSignupAlwaysOpen } from "shared/utils/isDirectSignupAlwaysOpen";

beforeEach(() => {
  vi.spyOn(config, "event").mockReturnValue({
    ...config.event(),
    directSignupAlwaysOpenIds: ["always-open-id"],
  });
});

describe("isDirectSignupAlwaysOpen", () => {
  test("returns false for a regular program item", () => {
    expect(isDirectSignupAlwaysOpen(testProgramItem)).toEqual(false);
  });

  test("returns true when program item is in directSignupAlwaysOpenIds", () => {
    const programItem = { ...testProgramItem, programItemId: "always-open-id" };
    expect(isDirectSignupAlwaysOpen(programItem)).toEqual(true);
  });

  test("returns true for a pre-convention week program item even if not listed", () => {
    const programItem = {
      ...testProgramItem,
      tags: [...testProgramItem.tags, Tag.PRE_CONVENTION_WEEK],
    };
    expect(isDirectSignupAlwaysOpen(programItem)).toEqual(true);
  });
});
