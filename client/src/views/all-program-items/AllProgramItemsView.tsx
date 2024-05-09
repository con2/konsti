import { ReactElement, useEffect, useMemo, useState } from "react";
import { useStore } from "react-redux";
import { useDebounce } from "use-debounce";
import { AllProgramItemsList } from "client/views/all-program-items/components/AllProgramItemsList";
import { getUpcomingProgramItems } from "client/utils/getUpcomingProgramItems";
import { loadGames } from "client/utils/loadData";
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
  const activeGames = useAppSelector(selectActiveProgramItems);
  const hiddenGames = useAppSelector((state) => state.admin.hiddenProgramItems);
  const testTime = useAppSelector((state) => state.testSettings.testTime);
  const signupStrategy = useAppSelector((state) => state.admin.signupStrategy);

  const [selectedTag, setSelectedTag] = useState<Tag | Language | "">(
    getSavedTag(),
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>(getSavedSearchTerm());
  const [filteredGames, setFilteredGames] = useState<readonly ProgramItem[]>(
    [],
  );
  const [selectedStartingTime, setSelectedStartingTime] =
    useState<StartingTimeOption>(getSavedStartingTime());

  const [debouncedSearchTerm] = useDebounce(searchTerm, 300, {
    leading: true,
  });

  const activeVisibleGames = useMemo(
    () =>
      activeGames.filter((programItem) => {
        const hidden = hiddenGames.find(
          (hiddenGame) =>
            programItem.programItemId === hiddenGame.programItemId,
        );
        if (!hidden) {
          return programItem;
        }
      }),
    [activeGames, hiddenGames],
  );

  const store = useStore();

  useEffect(() => {
    setLoading(true);
    const fetchData = async (): Promise<void> => {
      await loadGames();
      setLoading(false);
    };
    fetchData();
  }, [store, testTime, signupStrategy]);

  useEffect(() => {
    sessionStorage.setItem(
      SessionStorageValue.ALL_GAMES_SEARCH_TERM,
      debouncedSearchTerm,
    );

    if (debouncedSearchTerm.length === 0) {
      setFilteredGames(activeVisibleGames);
      return;
    }

    const gamesFilteredBySearchTerm = activeVisibleGames.filter(
      (activeGame) => {
        return (
          activeGame.title
            .replace(MULTIPLE_WHITESPACES_REGEX, " ")
            .toLocaleLowerCase()
            .includes(debouncedSearchTerm.toLocaleLowerCase()) ||
          activeGame.gameSystem
            .replace(MULTIPLE_WHITESPACES_REGEX, " ")
            .toLocaleLowerCase()
            .includes(debouncedSearchTerm.toLocaleLowerCase())
        );
      },
    );

    setFilteredGames(gamesFilteredBySearchTerm);
  }, [debouncedSearchTerm, activeVisibleGames]);

  const memoizedGames = useMemo(() => {
    return (
      <AllProgramItemsList
        programItems={getVisibleGames(
          filteredGames,
          selectedStartingTime,
          selectedTag,
        )}
      />
    );
  }, [filteredGames, selectedStartingTime, selectedTag]);

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
      {loading ? <Loading /> : memoizedGames}
    </>
  );
};

const getVisibleGames = (
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
    if (programItem.language.includes(selectedTag as Language)) {
      return programItem;
    }
    if (
      (programItem.language === Language.FINNISH_OR_ENGLISH ||
        programItem.language === Language.LANGUAGE_FREE) &&
      (selectedTag === Language.FINNISH || selectedTag === Language.ENGLISH)
    ) {
      return programItem;
    }
  });
};
