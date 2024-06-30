import { ReactElement, useEffect, useMemo, useState } from "react";
import { useStore } from "react-redux";
import { useDebounce } from "use-debounce";
import { AllProgramItemsList } from "client/views/all-program-items/components/AllProgramItemsList";
import { getUpcomingProgramItems } from "client/utils/getUpcomingProgramItems";
import { loadProgramItems } from "client/utils/loadData";
import { Loading } from "client/components/Loading";
import {
  ProgramItem,
  Language,
  ProgramType,
  Tag,
} from "shared/types/models/programItem";
import { useAppSelector } from "client/utils/hooks";
import { selectActiveProgramItems } from "client/views/admin/adminSlice";
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

export const MULTIPLE_WHITESPACES_REGEX = /\s\s+/g;

export const AllProgramItemsView = (): ReactElement => {
  const activeProgramItems = useAppSelector(selectActiveProgramItems);
  const hiddenProgramItems = useAppSelector(
    (state) => state.admin.hiddenProgramItems,
  );
  const testTime = useAppSelector((state) => state.testSettings.testTime);
  const signupStrategy = useAppSelector((state) => state.admin.signupStrategy);

  const [selectedTag, setSelectedTag] = useState<Tag | Language | "">(
    getSavedTag(),
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>(getSavedSearchTerm());
  const [filteredProgramItems, setFilteredProgramItems] = useState<
    readonly ProgramItem[]
  >([]);
  const [selectedStartingTime, setSelectedStartingTime] =
    useState<StartingTimeOption>(getSavedStartingTime());

  const [debouncedSearchTerm] = useDebounce(searchTerm, 300, {
    leading: true,
  });

  const activeVisibleProgramItems = useMemo(
    () =>
      activeProgramItems.filter((programItem) => {
        const hidden = hiddenProgramItems.find(
          (hiddenProgramItem) =>
            programItem.programItemId === hiddenProgramItem.programItemId,
        );
        if (!hidden) {
          return programItem;
        }
      }),
    [activeProgramItems, hiddenProgramItems],
  );

  const store = useStore();

  useEffect(() => {
    setLoading(true);
    const fetchData = async (): Promise<void> => {
      await loadProgramItems();
      setLoading(false);
    };
    fetchData();
  }, [store, testTime, signupStrategy]);

  useEffect(() => {
    sessionStorage.setItem(
      SessionStorageValue.ALL_PROGRAM_ITEMS_SEARCH_TERM,
      debouncedSearchTerm,
    );

    if (debouncedSearchTerm.length === 0) {
      setFilteredProgramItems(activeVisibleProgramItems);
      return;
    }

    const programItemsFilteredBySearchTerm = activeVisibleProgramItems.filter(
      (activeProgramItem) => {
        return (
          activeProgramItem.title
            .replace(MULTIPLE_WHITESPACES_REGEX, " ")
            .toLocaleLowerCase()
            .includes(debouncedSearchTerm.toLocaleLowerCase()) ||
          activeProgramItem.gameSystem
            .replace(MULTIPLE_WHITESPACES_REGEX, " ")
            .toLocaleLowerCase()
            .includes(debouncedSearchTerm.toLocaleLowerCase())
        );
      },
    );

    setFilteredProgramItems(programItemsFilteredBySearchTerm);
  }, [debouncedSearchTerm, activeVisibleProgramItems]);

  const memoizedProgramItems = useMemo(() => {
    return (
      <AllProgramItemsList
        programItems={getVisibleProgramItems(
          filteredProgramItems,
          selectedStartingTime,
          selectedTag,
        )}
      />
    );
  }, [filteredProgramItems, selectedStartingTime, selectedTag]);

  return (
    <>
      <SearchAndFilterCard
        selectedTag={selectedTag}
        setSelectedTag={setSelectedTag}
        selectedStartingTime={selectedStartingTime}
        setSelectedStartingTime={setSelectedStartingTime}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />
      {loading ? <Loading /> : memoizedProgramItems}
    </>
  );
};

const getVisibleProgramItems = (
  programItems: readonly ProgramItem[],
  selectedView: string,
  selectedTag: string,
): readonly ProgramItem[] => {
  const filteredProgramItems = getTagFilteredProgramItems(
    programItems,
    selectedTag,
  );

  if (selectedView === StartingTimeOption.UPCOMING) {
    return getUpcomingProgramItems(filteredProgramItems);
  } else if (selectedView === StartingTimeOption.REVOLVING_DOOR) {
    return getUpcomingProgramItems(filteredProgramItems).filter(
      (programItem) => programItem.revolvingDoor,
    );
  }

  return filteredProgramItems;
};

const getTagFilteredProgramItems = (
  programItems: readonly ProgramItem[],
  selectedTag: string,
): readonly ProgramItem[] => {
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
