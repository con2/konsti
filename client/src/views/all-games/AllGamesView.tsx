import { ReactElement, useState, useEffect, useMemo } from "react";
import { useStore } from "react-redux";
import { Link } from "react-router-dom";
import { TFunction } from "i18next";
import dayjs from "dayjs";
import styled from "styled-components";
import { useDebounce } from "use-debounce";
import { AllGamesList } from "client/views/all-games/components/AllGamesList";
import { getUpcomingGames } from "client/utils/getUpcomingGames";
import { loadGames } from "client/utils/loadData";
import { Loading } from "client/components/Loading";
import { Game, ProgramType, Tag } from "shared/typings/models/game";
import { getTime } from "client/utils/getTime";
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
  const testTime = useAppSelector((state) => state.testSettings.testTime);
  const hiddenGames = useAppSelector((state) => state.admin.hiddenGames);
  const signupStrategy = useAppSelector((state) => state.admin.signupStrategy);

  const [selectedTag, setSelectedTag] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filteredGames, setFilteredGames] = useState<readonly Game[]>([]);
  const [selectedStartingTime, setSelectedStartingTime] = useState<string>("");

  const [debouncedSearchTerm] = useDebounce(searchTerm, 300, {
    leading: true,
  });

  const store = useStore();

  useEffect(() => {
    setLoading(true);

    const loadSessionStorageValues = (): void => {
      const savedSearchTerm = sessionStorage.getItem(
        SessionStorageValue.ALL_GAMES_SEARCH_TERM
      );
      setSearchTerm(savedSearchTerm ?? "");

      const savedTag = sessionStorage.getItem(
        SessionStorageValue.ALL_GAMES_TAG
      );
      setSelectedTag(savedTag ?? "");

      const savedStartingTime = sessionStorage.getItem(
        SessionStorageValue.ALL_GAMES_STARTING_TIME
      );
      setSelectedStartingTime(savedStartingTime ?? "");
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
      debouncedSearchTerm
    );

    if (debouncedSearchTerm.length === 0) {
      setFilteredGames(activeGames);
      return;
    }

    const gamesFilteredBySearchTerm = activeGames.filter(
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
      }
    );

    setFilteredGames(gamesFilteredBySearchTerm);
  }, [debouncedSearchTerm, activeGames]);

  const memoizedGames = useMemo(() => {
    return (
      <AllGamesList
        games={getVisibleGames(
          filteredGames,
          hiddenGames,
          selectedStartingTime,
          selectedTag
        )}
      />
    );
  }, [filteredGames, hiddenGames, selectedStartingTime, selectedTag]);

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
  hiddenGames: readonly Game[],
  selectedView: string,
  selectedTag: string
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
  selectedTag: string
): readonly Game[] => {
  if (!selectedTag) return games;
  return games.filter(
    (game) =>
      game.programType.includes(selectedTag as ProgramType) ||
      game.tags.includes(selectedTag as Tag)
  );
};

const getRunningRevolvingDoorGames = (
  games: readonly Game[],
  t: TFunction
): ReactElement | ReactElement[] => {
  const timeNow = getTime();
  const runningGames = games.filter((game) => {
    return (
      game.revolvingDoor &&
      dayjs(game.startTime).isBefore(timeNow) &&
      dayjs(game.endTime).isAfter(timeNow)
    );
  });

  if (!runningGames || runningGames.length === 0) {
    return <p>{t("noCurrentlyRunningGames")}</p>;
  }
  return runningGames.map((game) => {
    return (
      <div key={game.gameId}>
        <Link to={`/games/${game.gameId}`}>{game.title}</Link>{" "}
        <GameListShortDescription>
          {game.shortDescription ? game.shortDescription : game.gameSystem}
        </GameListShortDescription>
      </div>
    );
  });
};

const GameListShortDescription = styled.p`
  font-size: ${(props) => props.theme.fontSizeSmall};
  font-style: italic;
  margin: 4px 0 8px 14px;
`;
