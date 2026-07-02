import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { config } from "shared/config";
import {
  AgeGroup,
  Language,
  ProgramType,
  Tag,
} from "shared/types/models/programItem";
import { testProgramItem } from "shared/tests/testProgramItem";
import {
  StartingTimeOption,
  getActiveStickyHeaderIndex,
  getTagFilteredProgramItems,
  getVisibleProgramItems,
} from "client/views/all-program-items/programListUtils";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("getTagFilteredProgramItems", () => {
  test("returns all items when no tag is selected", () => {
    const items = [
      { ...testProgramItem, programItemId: "a" },
      { ...testProgramItem, programItemId: "b" },
    ];
    expect(getTagFilteredProgramItems(items, [])).toEqual(items);
  });

  test("filters by tag", () => {
    const beginnerFriendly = {
      ...testProgramItem,
      programItemId: "a",
      tags: [Tag.BEGINNER_FRIENDLY],
    };
    const noTags = { ...testProgramItem, programItemId: "b", tags: [] };
    expect(
      getTagFilteredProgramItems(
        [beginnerFriendly, noTags],
        [Tag.BEGINNER_FRIENDLY],
      ),
    ).toEqual([beginnerFriendly]);
  });

  test("filters by multiple tags with AND logic", () => {
    // Finnish beginner-friendly program for families
    const allThree = {
      ...testProgramItem,
      programItemId: "a",
      tags: [Tag.BEGINNER_FRIENDLY],
      ageGroups: [AgeGroup.FAMILIES],
      languages: [Language.FINNISH],
    };
    const onlyBeginnerFriendly = {
      ...testProgramItem,
      programItemId: "b",
      tags: [Tag.BEGINNER_FRIENDLY],
      ageGroups: [],
      languages: [Language.ENGLISH],
    };
    const onlyFinnish = {
      ...testProgramItem,
      programItemId: "c",
      tags: [],
      ageGroups: [],
      languages: [Language.FINNISH],
    };
    expect(
      getTagFilteredProgramItems(
        [allThree, onlyBeginnerFriendly, onlyFinnish],
        [Tag.BEGINNER_FRIENDLY, AgeGroup.FAMILIES, Language.FINNISH],
      ),
    ).toEqual([allThree]);
  });

  test("filters by age group", () => {
    const kids = {
      ...testProgramItem,
      programItemId: "a",
      ageGroups: [AgeGroup.KIDS],
    };
    const adults = {
      ...testProgramItem,
      programItemId: "b",
      ageGroups: [AgeGroup.ADULTS],
    };
    expect(getTagFilteredProgramItems([kids, adults], [AgeGroup.KIDS])).toEqual(
      [kids],
    );
  });

  test("filters by language", () => {
    const finnish = {
      ...testProgramItem,
      programItemId: "a",
      languages: [Language.FINNISH],
    };
    const english = {
      ...testProgramItem,
      programItemId: "b",
      languages: [Language.ENGLISH],
    };
    expect(
      getTagFilteredProgramItems([finnish, english], [Language.ENGLISH]),
    ).toEqual([english]);
  });

  test("filters by program type", () => {
    const rpg = {
      ...testProgramItem,
      programItemId: "a",
      programType: ProgramType.TABLETOP_RPG,
    };
    const larp = {
      ...testProgramItem,
      programItemId: "b",
      programType: ProgramType.LARP,
    };
    expect(getTagFilteredProgramItems([rpg, larp], [ProgramType.LARP])).toEqual(
      [larp],
    );
  });

  test("a language-free item matches any language filter", () => {
    const languageFree = {
      ...testProgramItem,
      programItemId: "a",
      languages: [Language.LANGUAGE_FREE],
    };
    const finnishOnly = {
      ...testProgramItem,
      programItemId: "b",
      languages: [Language.FINNISH],
    };
    expect(
      getTagFilteredProgramItems(
        [languageFree, finnishOnly],
        [Language.ENGLISH],
      ),
    ).toEqual([languageFree]);
  });
});

describe("getVisibleProgramItems", () => {
  beforeEach(() => {
    // Make the main event program visible so the time-based phase filter is a
    // no-op, isolating the tag/fullness filters under test
    vi.spyOn(config, "event").mockReturnValue({
      ...config.event(),
      mainEventProgramVisibleTime: null,
    });
  });

  test("hideFull removes items whose ids are in fullProgramItemIds", () => {
    const full = { ...testProgramItem, programItemId: "full" };
    const open = { ...testProgramItem, programItemId: "open" };
    expect(
      getVisibleProgramItems(
        [full, open],
        StartingTimeOption.ALL,
        [],
        true,
        new Set(["full"]),
      ),
    ).toEqual([open]);
  });

  test("keeps full items when hideFull is off", () => {
    const full = { ...testProgramItem, programItemId: "full" };
    const open = { ...testProgramItem, programItemId: "open" };
    expect(
      getVisibleProgramItems(
        [full, open],
        StartingTimeOption.ALL,
        [],
        false,
        new Set(["full"]),
      ),
    ).toEqual([full, open]);
  });

  test("applies the tag filter", () => {
    const larp = {
      ...testProgramItem,
      programItemId: "larp",
      programType: ProgramType.LARP,
    };
    const rpg = {
      ...testProgramItem,
      programItemId: "rpg",
      programType: ProgramType.TABLETOP_RPG,
    };
    expect(
      getVisibleProgramItems(
        [larp, rpg],
        StartingTimeOption.ALL,
        [ProgramType.LARP],
        false,
        new Set<string>(),
      ),
    ).toEqual([larp]);
  });
});

describe("getActiveStickyHeaderIndex", () => {
  test("returns 0 when there are no headers", () => {
    expect(getActiveStickyHeaderIndex([], 5)).toEqual(0);
  });

  test("returns the first header when the range starts at the top", () => {
    expect(getActiveStickyHeaderIndex([0, 4, 9], 0)).toEqual(0);
  });

  test("returns the last header at or before the range start", () => {
    expect(getActiveStickyHeaderIndex([0, 4, 9], 6)).toEqual(4);
  });

  test("returns the header sitting exactly at the range start", () => {
    expect(getActiveStickyHeaderIndex([0, 4, 9], 9)).toEqual(9);
  });

  test("returns the last header when scrolled past all of them", () => {
    expect(getActiveStickyHeaderIndex([0, 4, 9], 20)).toEqual(9);
  });
});
