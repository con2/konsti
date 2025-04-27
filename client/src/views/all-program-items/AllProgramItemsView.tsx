import { ReactElement, useEffect, useMemo, useState } from "react";
import { useDebounce } from "use-debounce";
import { useSearchParams } from "react-router";
import { AllProgramItemsList } from "client/views/all-program-items/components/AllProgramItemsList";
import { getUpcomingProgramItems } from "client/utils/getUpcomingProgramItems";
import { Loading } from "client/components/Loading";
import {
  ProgramItem,
  Language,
  ProgramType,
  Tag,
} from "shared/types/models/programItem";
import { useAppDispatch, useAppSelector } from "client/utils/hooks";
import {
  selectActiveProgramItems,
  selectHiddenProgramItems,
  setActiveProgramType,
} from "client/views/admin/adminSlice";
import {
  SessionStorageValue,
  getSavedSearchTerm,
  getSavedStartingTime,
  getSavedTag,
} from "client/utils/sessionStorage";
import {
  SearchAndFilterCard,
  StartingTimeOption,
} from "client/views/all-program-items/components/SearchAndFilterCard";
import { config } from "shared/config";
import { ScrollToTopButton } from "client/components/ScrollToTopButton";

export const MULTIPLE_WHITESPACES_REGEX = /\s\s+/g;
const programTypeQueryParam = "programType";

type ProgramItemWithFullness = ProgramItem & {
  isFull: boolean;
};

export const AllProgramItemsView = (): ReactElement => {
  const [searchParams, setSearchParams] = useSearchParams();
  const programTypeQueryParamValue = searchParams.get(programTypeQueryParam);
  const dispatch = useAppDispatch();

  const activeProgramItems = useAppSelector(selectActiveProgramItems);
  const hiddenProgramItems = useAppSelector(selectHiddenProgramItems);
  const signups = useAppSelector(
    (state) => state.allProgramItems.directSignups,
  );

  const [selectedTag, setSelectedTag] = useState<Tag | Language | "">(
    getSavedTag(),
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>(getSavedSearchTerm());
  const [hideFullItems, setHideFullItems] = useState<boolean>(false);
  const [filteredProgramItems, setFilteredProgramItems] = useState<
    readonly ProgramItemWithFullness[]
  >([]);
  const [selectedStartingTime, setSelectedStartingTime] =
    useState<StartingTimeOption>(getSavedStartingTime());

  const [debouncedSearchTerm] = useDebounce(searchTerm, 300, {
    leading: true,
  });

  const activeVisibleProgramItems: ProgramItemWithFullness[] = useMemo(
    () =>
      activeProgramItems
        .filter((programItem) => {
          const hidden = hiddenProgramItems.find(
            (hiddenProgramItem) =>
              programItem.programItemId === hiddenProgramItem.programItemId,
          );
          if (!hidden) {
            return programItem;
          }
        })
        .map((programItem) => {
          const signupCount =
            signups.find(
              (signup) => signup.programItemId == programItem.programItemId,
            )?.users.length ?? -1;
          return {
            ...programItem,
            isFull: signupCount >= programItem.maxAttendance,
          };
        }),
    [activeProgramItems, hiddenProgramItems, signups],
  );

  useEffect(() => {
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
      setFilteredProgramItems(activeVisibleProgramItems);
      setLoading(false);
      return;
    }

    const programItemsFilteredBySearchTerm = activeVisibleProgramItems.filter(
      (activeProgramItem) => {
        return (
          activeProgramItem.title
            .replaceAll(MULTIPLE_WHITESPACES_REGEX, " ")
            .toLocaleLowerCase()
            .includes(debouncedSearchTerm.toLocaleLowerCase()) ||
          activeProgramItem.gameSystem
            .replaceAll(MULTIPLE_WHITESPACES_REGEX, " ")
            .toLocaleLowerCase()
            .includes(debouncedSearchTerm.toLocaleLowerCase())
        );
      },
    );

    setFilteredProgramItems(programItemsFilteredBySearchTerm);
    setLoading(false);
  }, [debouncedSearchTerm, activeVisibleProgramItems]);

  const programTypePairs = config
    .client()
    .programTypeSelectOptions.map((type) => ({
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
    setSearchParams("");
  }, [programTypePairs, dispatch, programTypeQueryParamValue, setSearchParams]);

  const memoizedProgramItems = useMemo(() => {
    return (
      <AllProgramItemsList
        programItems={getVisibleProgramItems(
          filteredProgramItems,
          selectedStartingTime,
          selectedTag,
          hideFullItems,
        )}
      />
    );
  }, [filteredProgramItems, hideFullItems, selectedStartingTime, selectedTag]);

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
  programItems: readonly ProgramItemWithFullness[],
  selectedView: StartingTimeOption,
  selectedTag: string,
  hideFull: boolean,
): readonly ProgramItem[] => {
  const tagFilteredProgramItems = getTagFilteredProgramItems(
    programItems,
    selectedTag,
  );

  const fullnessFiltered = hideFull
    ? tagFilteredProgramItems.filter((item) => !item.isFull)
    : tagFilteredProgramItems;

  if (selectedView === StartingTimeOption.UPCOMING) {
    return getUpcomingProgramItems(fullnessFiltered);
  } else if (selectedView === StartingTimeOption.REVOLVING_DOOR) {
    return getUpcomingProgramItems(fullnessFiltered).filter(
      (programItem) => programItem.revolvingDoor,
    );
  }

  return fullnessFiltered;
};

const getTagFilteredProgramItems = (
  programItems: readonly ProgramItemWithFullness[],
  selectedTag: string,
): readonly ProgramItemWithFullness[] => {
  if (!selectedTag) {
    return programItems;
  }
  return programItems.filter((programItem) => {
    if (programItem.programType.includes(selectedTag as ProgramType)) {
      return programItem;
    }
    if (programItem.tags.includes(selectedTag as Tag)) {
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
