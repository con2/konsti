import { ReactElement, useEffect, useMemo, useState } from "react";
import { useStore } from "react-redux";
import { useDebounce } from "use-debounce";
import { AllGamesList } from "client/views/all-games/components/AllGamesList";
import { getUpcomingGames } from "client/utils/getUpcomingGames";
import { loadGames } from "client/utils/loadData";
import { Loading } from "client/components/Loading";
import { Game, Language, ProgramType, Tag } from "shared/typings/models/game";
import { useAppSelector } from "client/utils/hooks";
import { selectActiveGames } from "client/views/admin/adminSlice";
import { SessionStorageValue } from "client/utils/localStorage";
import {
  SearchAndFilterCard,
  StartingTimeOption,
} from "client/views/all-games/components/SearchAndFilterCard";

export const MULTIPLE_WHITESPACES_REGEX = /\s\s+/g;

export const AllGamesView = (): ReactElement => {
  const activeGames = useAppSelector(selectActiveGames);
  const hiddenGames = useAppSelector((state) => state.admin.hiddenGames);
  const testTime = useAppSelector((state) => state.testSettings.testTime);
  const signupStrategy = useAppSelector((state) => state.admin.signupStrategy);

  const [selectedTag, setSelectedTag] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filteredGames, setFilteredGames] = useState<readonly Game[]>([]);
  const [selectedStartingTime, setSelectedStartingTime] =
    useState<StartingTimeOption>(StartingTimeOption.UPCOMING);

  const [debouncedSearchTerm] = useDebounce(searchTerm, 300, {
    leading: true,
  });

  const activeVisibleGames = useMemo(
    () =>
      activeGames.filter((game) => {
        const hidden = hiddenGames.find(
          (hiddenGame) => game.gameId === hiddenGame.gameId,
        );
        if (!hidden) {
          return game;
        }
      }),
    [activeGames, hiddenGames],
  );

  const store = useStore();

  useEffect(() => {
    setLoading(true);

    const loadSessionStorageValues = (): void => {
      const savedSearchTerm = sessionStorage.getItem(
        SessionStorageValue.ALL_GAMES_SEARCH_TERM,
      );
      setSearchTerm(savedSearchTerm ?? "");

      const savedTag = sessionStorage.getItem(
        SessionStorageValue.ALL_GAMES_TAG,
      );
      setSelectedTag(savedTag ?? "");

      const savedStartingTime = sessionStorage.getItem(
        SessionStorageValue.ALL_GAMES_STARTING_TIME,
      );
      setSelectedStartingTime(
        (savedStartingTime as StartingTimeOption) ??
          StartingTimeOption.UPCOMING,
      );
    };
    loadSessionStorageValues();

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
      <AllGamesList
        games={getVisibleGames(
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
        onTagChange={setSelectedTag}
        onSelectedStartingTimeChange={setSelectedStartingTime}
        onSearchTermChange={setSearchTerm}
      />
      {loading ? <Loading /> : memoizedGames}
    </>
  );
};

const getVisibleGames = (
  games: readonly Game[],
  selectedView: string,
  selectedTag: string,
): readonly Game[] => {
  const filteredGames = getTagFilteredGames(games, selectedTag);

  if (selectedView === StartingTimeOption.UPCOMING) {
    return getUpcomingGames(filteredGames);
  } else if (selectedView === StartingTimeOption.REVOLVING_DOOR) {
    return getUpcomingGames(filteredGames).filter((game) => game.revolvingDoor);
  }

  return filteredGames;
};

const getTagFilteredGames = (
  games: readonly Game[],
  selectedTag: string,
): readonly Game[] => {
  if (!selectedTag) {
    return games;
  }
  return games.filter((game) => {
    if (game.programType.includes(selectedTag as ProgramType)) {
      return game;
    }
    if (game.tags.includes(selectedTag as Tag)) {
      return game;
    }
    if (game.language.includes(selectedTag as Language)) {
      return game;
    }
    if (
      (game.language === Language.FINNISH_OR_ENGLISH ||
        game.language === Language.LANGUAGE_FREE) &&
      (selectedTag === Language.FINNISH || selectedTag === Language.ENGLISH)
    ) {
      return game;
    }
  });
};
