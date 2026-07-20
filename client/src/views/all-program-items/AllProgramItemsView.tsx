import {
  ReactElement,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useDebounce } from "use-debounce";
import { useSearchParams } from "react-router";
import { AllProgramItemsList } from "client/views/all-program-items/components/AllProgramItemsList";
import { usePreviousLocation } from "client/app/HistoryContext";
import { AppRoute } from "client/app/AppRoutes";
import { Loading } from "client/components/Loading";
import {
  ProgramItem,
  Language,
  Tag,
  AgeGroup,
} from "shared/types/models/programItem";
import { useAppDispatch, useAppSelector } from "client/utils/hooks";
import {
  selectActiveProgramItems,
  selectHiddenProgramItems,
  setActiveProgramTypes,
} from "client/views/admin/adminSlice";
import {
  SessionStorageValue,
  getSavedHideFull,
  getSavedSearchTerm,
  getSavedStartingTime,
  getSavedTags,
} from "client/utils/sessionStorage";
import { SearchAndFilterCard } from "client/views/all-program-items/components/SearchAndFilterCard";
import { getProgramTypeSelectOptions } from "client/utils/getProgramTypeSelectOptions";
import { ScrollToTopButton } from "client/components/ScrollToTopButton";
import { getProgramItemValidity } from "shared/utils/getProgramItemValidity";
import {
  StartingTimeOption,
  getVisibleProgramItems,
} from "client/views/all-program-items/programListUtils";

export const MULTIPLE_WHITESPACES_REGEX = /\s\s+/g;
// Query param that selects a program type
const programTypeQueryParam = "programType";
// Query param that lists program items missing required info, like attendance limits
const invalidQueryParam = "invalid";

// Config-derived and constant, and must be referentially stable: the query
// param effect below depends on it, and dispatching setActiveProgramTypes
// re-renders this view, so an unstable value would loop the effect
const programTypePairs = getProgramTypeSelectOptions().map((type) => ({
  lowerCase: type.toLocaleLowerCase(),
  originalValue: type,
}));

export const AllProgramItemsView = (): ReactElement => {
  const [searchParams, setSearchParams] = useSearchParams();
  const programTypeQueryParamValue = searchParams.get(programTypeQueryParam);
  const showOnlyInvalidProgramItems = searchParams.has(invalidQueryParam);
  const dispatch = useAppDispatch();
  const previousLocation = usePreviousLocation();

  const activeProgramItems = useAppSelector(selectActiveProgramItems);
  const hiddenProgramItems = useAppSelector(selectHiddenProgramItems);
  const signups = useAppSelector(
    (state) => state.allProgramItems.directSignups,
  );

  const [selectedTags, setSelectedTags] =
    useState<(Tag | Language | AgeGroup)[]>(getSavedTags());
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
  // spread) so the memoized list row can bail out when the same item persists
  // across a program type change
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

  useEffect(() => {
    if (!programTypeQueryParamValue) {
      return;
    }
    const programTypePair = programTypePairs.find(
      (key) => key.lowerCase === programTypeQueryParamValue,
    );
    if (programTypePair) {
      dispatch(
        setActiveProgramTypes(
          programTypePair.originalValue === "all"
            ? []
            : [programTypePair.originalValue],
        ),
      );
    }
    // Drop the handled programType param but keep other params, like invalid
    setSearchParams((prev) => {
      prev.delete(programTypeQueryParam);
      return prev;
    });
  }, [dispatch, programTypeQueryParamValue, setSearchParams]);

  const programItemsToShow = useMemo(() => {
    const visibleProgramItems = getVisibleProgramItems(
      filteredProgramItems,
      selectedStartingTime,
      selectedTags,
      hideFullItems,
      fullProgramItemIds,
    );
    return showOnlyInvalidProgramItems
      ? visibleProgramItems.filter(
          (programItem) => !getProgramItemValidity(programItem).allValuesValid,
        )
      : visibleProgramItems;
  }, [
    filteredProgramItems,
    hideFullItems,
    selectedStartingTime,
    selectedTags,
    showOnlyInvalidProgramItems,
    fullProgramItemIds,
  ]);

  // Render the (expensive) list at lower priority so changing a filter keeps
  // the controls responsive instead of freezing the main thread while hundreds
  // of program items mount
  const deferredProgramItems = useDeferredValue(programItemsToShow);

  // While the deferred list is still catching up from an empty state (initial
  // load, or returning from a no-results filter) keep showing Loading, so the
  // stale empty value doesn't render a premature "no program items" message
  const isListPending = programItemsToShow !== deferredProgramItems;
  const showLoading =
    loading || (isListPending && deferredProgramItems.length === 0);

  // If the user just came back from a program item page, briefly highlight that
  // item in the list. Captured once on mount, before the previous location is
  // overwritten, then cleared after the highlight has had time to play
  const [highlightedProgramItemId, setHighlightedProgramItemId] = useState<
    string | null
  >(() => {
    const previousPathname = previousLocation?.pathname ?? "";
    const programItemPrefix = `${AppRoute.PROGRAM_ITEM}/`;
    return previousPathname.startsWith(programItemPrefix)
      ? previousPathname.slice(programItemPrefix.length)
      : null;
  });

  useEffect(() => {
    if (highlightedProgramItemId === null) {
      return;
    }
    const timer = setTimeout(() => setHighlightedProgramItemId(null), 1000);
    return () => clearTimeout(timer);
  }, [highlightedProgramItemId]);

  return (
    <>
      <SearchAndFilterCard
        selectedTags={selectedTags}
        setSelectedTags={setSelectedTags}
        selectedStartingTime={selectedStartingTime}
        setSelectedStartingTime={setSelectedStartingTime}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        hideFullItems={hideFullItems}
        setHideFullItems={setHideFullItems}
      />
      {showLoading ? (
        <Loading />
      ) : (
        <AllProgramItemsList
          programItems={deferredProgramItems}
          highlightedProgramItemId={highlightedProgramItemId}
        />
      )}
      <ScrollToTopButton />
    </>
  );
};
