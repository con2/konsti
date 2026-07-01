import { ReactElement, useEffect, useMemo, useState } from "react";
import { useDebounce } from "use-debounce";
import { useSearchParams } from "react-router";
import { AllProgramItemsList } from "client/views/all-program-items/components/AllProgramItemsList";
import {
  getUpcomingProgramItems,
  isMainEventProgramVisible,
} from "client/utils/getUpcomingProgramItems";
import { Loading } from "client/components/Loading";
import {
  ProgramItem,
  Language,
  Tag,
  AgeGroup,
} from "shared/types/models/programItem";
import { getTimeNow } from "client/utils/getTimeNow";
import { isPreConventionWeekProgramItem } from "shared/utils/isPreConventionWeekProgramItem";
import { useAppDispatch, useAppSelector } from "client/utils/hooks";
import {
  selectActiveProgramItems,
  selectHiddenProgramItems,
  setActiveProgramType,
} from "client/views/admin/adminSlice";
import {
  SessionStorageValue,
  getSavedHideFull,
  getSavedSearchTerm,
  getSavedStartingTime,
  getSavedTag,
} from "client/utils/sessionStorage";
import {
  SearchAndFilterCard,
  StartingTimeOption,
} from "client/views/all-program-items/components/SearchAndFilterCard";
import { getProgramTypeSelectOptions } from "client/utils/getProgramTypeSelectOptions";
import { ScrollToTopButton } from "client/components/ScrollToTopButton";
import { getProgramItemValidity } from "client/views/program-item/programItemUtils";

export const MULTIPLE_WHITESPACES_REGEX = /\s\s+/g;
// Query param that selects a program type
const programTypeQueryParam = "programType";
// Query param that lists program items missing required info, like attendance limits
const invalidQueryParam = "invalid";

export const AllProgramItemsView = (): ReactElement => {
  const [searchParams, setSearchParams] = useSearchParams();
  const programTypeQueryParamValue = searchParams.get(programTypeQueryParam);
  const showOnlyInvalidProgramItems = searchParams.has(invalidQueryParam);
  const dispatch = useAppDispatch();

  const activeProgramItems = useAppSelector(selectActiveProgramItems);
  const hiddenProgramItems = useAppSelector(selectHiddenProgramItems);
  const signups = useAppSelector(
    (state) => state.allProgramItems.directSignups,
  );

  const [selectedTag, setSelectedTag] = useState<
    Tag | Language | AgeGroup | ""
  >(getSavedTag());
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>(getSavedSearchTerm());
  const [hideFullItems, setHideFullItems] =
    useState<boolean>(getSavedHideFull());
  const [filteredProgramItems, setFilteredProgramItems] = useState<
    readonly ProgramItem[]
  >([]);
  const [selectedStartingTime, setSelectedStartingTime] =
    useState<StartingTimeOption>(getSavedStartingTime());

  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);

  // Keep the original program item references stable (no per-item object
  // spread) so React.memo on ProgramItemEntry can bail out when the same item
  // persists across a program type change
  const activeVisibleProgramItems: readonly ProgramItem[] = useMemo(() => {
    const hiddenIds = new Set(
      hiddenProgramItems.map(
        (hiddenProgramItem) => hiddenProgramItem.programItemId,
      ),
    );
    return activeProgramItems.filter(
      (programItem) => !hiddenIds.has(programItem.programItemId),
    );
  }, [activeProgramItems, hiddenProgramItems]);

  // Track fullness separately from the program item objects (an O(1) id lookup)
  const fullProgramItemIds: ReadonlySet<string> = useMemo(() => {
    const signupCountByProgramItemId = new Map(
      signups.map((signup) => [signup.programItemId, signup.users.length]),
    );
    const fullIds = new Set<string>();
    for (const programItem of activeProgramItems) {
      const signupCount =
        signupCountByProgramItemId.get(programItem.programItemId) ?? -1;
      if (signupCount >= programItem.maxAttendance) {
        fullIds.add(programItem.programItemId);
      }
    }
    return fullIds;
  }, [activeProgramItems, signups]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(false);
  }, [
    /* effect dep */ activeProgramItems,
    /* effect dep */ hiddenProgramItems,
    /* effect dep */ signups,
  ]);

  useEffect(() => {
    sessionStorage.setItem(
      SessionStorageValue.ALL_PROGRAM_ITEMS_SEARCH_TERM,
      debouncedSearchTerm,
    );

    if (debouncedSearchTerm.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFilteredProgramItems(activeVisibleProgramItems);
      setLoading(false);
      return;
    }

    const programItemsFilteredBySearchTerm = activeVisibleProgramItems.filter(
      (activeProgramItem) => {
        const cleanedSearchTerm = debouncedSearchTerm
          .toLocaleLowerCase()
          .trim();
        return (
          activeProgramItem.title
            .replaceAll(MULTIPLE_WHITESPACES_REGEX, " ")
            .toLocaleLowerCase()
            .includes(cleanedSearchTerm) ||
          activeProgramItem.gameSystem
            .replaceAll(MULTIPLE_WHITESPACES_REGEX, " ")
            .toLocaleLowerCase()
            .includes(cleanedSearchTerm)
        );
      },
    );

    setFilteredProgramItems(programItemsFilteredBySearchTerm);
    setLoading(false);
  }, [debouncedSearchTerm, activeVisibleProgramItems]);

  const programTypePairs = getProgramTypeSelectOptions().map((type) => ({
    lowerCase: type.toLocaleLowerCase(),
    originalValue: type,
  }));

  useEffect(() => {
    if (!programTypeQueryParamValue) {
      return;
    }
    const programTypePair = programTypePairs.find(
      (key) => key.lowerCase === programTypeQueryParamValue,
    );
    if (programTypePair) {
      dispatch(setActiveProgramType(programTypePair.originalValue));
    }
    // Drop the handled programType param but keep other params, like invalid
    setSearchParams((prev) => {
      prev.delete(programTypeQueryParam);
      return prev;
    });
  }, [programTypePairs, dispatch, programTypeQueryParamValue, setSearchParams]);

  const memoizedProgramItems = useMemo(() => {
    const visibleProgramItems = getVisibleProgramItems(
      filteredProgramItems,
      selectedStartingTime,
      selectedTag,
      hideFullItems,
      fullProgramItemIds,
    );
    const programItemsToShow = showOnlyInvalidProgramItems
      ? visibleProgramItems.filter(
          (programItem) => !getProgramItemValidity(programItem).allValuesValid,
        )
      : visibleProgramItems;
    return <AllProgramItemsList programItems={programItemsToShow} />;
  }, [
    filteredProgramItems,
    hideFullItems,
    selectedStartingTime,
    selectedTag,
    showOnlyInvalidProgramItems,
    fullProgramItemIds,
  ]);

  return (
    <>
      <SearchAndFilterCard
        selectedTag={selectedTag}
        setSelectedTag={setSelectedTag}
        selectedStartingTime={selectedStartingTime}
        setSelectedStartingTime={setSelectedStartingTime}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        hideFullItems={hideFullItems}
        setHideFullItems={setHideFullItems}
      />
      {loading ? <Loading /> : memoizedProgramItems}
      <ScrollToTopButton />
    </>
  );
};

const getVisibleProgramItems = (
  programItems: readonly ProgramItem[],
  selectedView: StartingTimeOption,
  selectedTag: string,
  hideFull: boolean,
  fullProgramItemIds: ReadonlySet<string>,
): readonly ProgramItem[] => {
  const tagFilteredProgramItems = getTagFilteredProgramItems(
    programItems,
    selectedTag,
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

const getTagFilteredProgramItems = (
  programItems: readonly ProgramItem[],
  selectedTag: string,
): readonly ProgramItem[] => {
  if (!selectedTag) {
    return programItems;
  }
  return programItems.filter((programItem) => {
    if (programItem.programType.includes(selectedTag)) {
      return programItem;
    }
    if (programItem.tags.includes(selectedTag as Tag)) {
      return programItem;
    }
    if (programItem.ageGroups.includes(selectedTag as AgeGroup)) {
      return programItem;
    }
    if (programItem.languages.includes(selectedTag as Language)) {
      return programItem;
    }
    if (
      programItem.languages.includes(Language.LANGUAGE_FREE) &&
      Object.values(Language).includes(selectedTag as Language)
    ) {
      return programItem;
    }
  });
};
