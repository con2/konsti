import {
  AgeGroup,
  Language,
  ProgramItem,
  Tag,
} from "shared/types/models/programItem";
import { isPreConventionWeekProgramItem } from "shared/utils/isPreConventionWeekProgramItem";
import {
  getUpcomingProgramItems,
  isMainEventProgramVisible,
} from "client/utils/getUpcomingProgramItems";
import { getTimeNow } from "client/utils/getTimeNow";

export enum StartingTimeOption {
  UPCOMING = "upcoming",
  ALL = "all",
  REVOLVING_DOOR = "revolvingDoor",
}

export const getVisibleProgramItems = (
  programItems: readonly ProgramItem[],
  selectedView: StartingTimeOption,
  selectedTags: readonly string[],
  hideFull: boolean,
  fullProgramItemIds: ReadonlySet<string>,
): readonly ProgramItem[] => {
  const tagFilteredProgramItems = getTagFilteredProgramItems(
    programItems,
    selectedTags,
  );

  const fullnessFiltered = hideFull
    ? tagFilteredProgramItems.filter(
        (item) => !fullProgramItemIds.has(item.programItemId),
      )
    : tagFilteredProgramItems;

  // Before the main event program is visible, only show pre-convention week program.
  // After it is visible, pre-convention week program is in the past so it drops out of
  // the upcoming list on its own
  const phaseFilteredProgramItems = isMainEventProgramVisible(getTimeNow())
    ? fullnessFiltered
    : fullnessFiltered.filter((programItem) =>
        isPreConventionWeekProgramItem(programItem),
      );

  if (selectedView === StartingTimeOption.UPCOMING) {
    return getUpcomingProgramItems(phaseFilteredProgramItems);
  } else if (selectedView === StartingTimeOption.REVOLVING_DOOR) {
    return getUpcomingProgramItems(phaseFilteredProgramItems).filter(
      (programItem) => programItem.revolvingDoor,
    );
  }

  return phaseFilteredProgramItems;
};

export const getTagFilteredProgramItems = (
  programItems: readonly ProgramItem[],
  selectedTags: readonly string[],
): readonly ProgramItem[] => {
  if (selectedTags.length === 0) {
    return programItems;
  }
  // Show items matching all of the selected tags (AND)
  return programItems.filter((programItem) =>
    selectedTags.every((selectedTag) => {
      if (programItem.programType.includes(selectedTag)) {
        return true;
      }
      if (programItem.tags.includes(selectedTag as Tag)) {
        return true;
      }
      if (programItem.ageGroups.includes(selectedTag as AgeGroup)) {
        return true;
      }
      if (programItem.languages.includes(selectedTag as Language)) {
        return true;
      }
      if (
        programItem.languages.includes(Language.LANGUAGE_FREE) &&
        Object.values(Language).includes(selectedTag as Language)
      ) {
        return true;
      }
      return false;
    }),
  );
};

// The header of the group currently at (or scrolled past) the top of the visible
// range — pinned to the top while its group scrolls. `stickyHeaderIndexes` is
// ascending, so the last one at or before `rangeStartIndex` is the active header
export const getActiveStickyHeaderIndex = (
  stickyHeaderIndexes: readonly number[],
  rangeStartIndex: number,
): number => {
  let activeIndex = 0;
  for (const headerIndex of stickyHeaderIndexes) {
    if (headerIndex > rangeStartIndex) {
      break;
    }
    activeIndex = headerIndex;
  }
  return activeIndex;
};
