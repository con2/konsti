import React, {
  ReactElement,
  ChangeEvent,
  useState,
  useEffect,
  useMemo,
} from "react";
import { useStore } from "react-redux";
import { Link } from "react-router-dom";
import { TFunction, useTranslation } from "react-i18next";
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
import { Button, ButtonStyle } from "client/components/Button";
import { selectActiveGames } from "client/views/admin/adminSlice";
import { Input } from "client/components/Input";
import { SessionStorageValue } from "client/utils/localStorage";

enum SelectedView {
  ALL = "all",
  UPCOMING = "upcoming",
  REVOLVING_DOOR = "revolving-door",
}

export const AllGamesView = (): ReactElement => {
  const { t } = useTranslation();

  const activeGames = useAppSelector(selectActiveGames);
  const testTime = useAppSelector((state) => state.testSettings.testTime);
  const hiddenGames = useAppSelector((state) => state.admin.hiddenGames);
  const signupStrategy = useAppSelector((state) => state.admin.signupStrategy);
  const activeProgramType = useAppSelector(
    (state) => state.admin.activeProgramType
  );

  const [selectedView, setSelectedView] = useState<SelectedView>(
    SelectedView.UPCOMING
  );
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filteredGames, setFilteredGames] = useState<readonly Game[]>([]);

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

      const savedSelectedView = sessionStorage.getItem(
        SessionStorageValue.ALL_GAMES_SELECTED_VIEW
      );
      setSelectedView(
        (savedSelectedView as SelectedView) ?? SelectedView.UPCOMING
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
      debouncedSearchTerm
    );

    if (debouncedSearchTerm.length === 0) {
      setFilteredGames(activeGames);
      return;
    }

    const gamesFilteredBySearchTerm = activeGames.filter((activeGame) => {
      return (
        activeGame.title
          .toLocaleLowerCase()
          .includes(debouncedSearchTerm.toLocaleLowerCase()) ||
        activeGame.gameSystem
          .toLocaleLowerCase()
          .includes(debouncedSearchTerm.toLocaleLowerCase())
      );
    });

    setFilteredGames(gamesFilteredBySearchTerm);
  }, [debouncedSearchTerm, activeGames]);

  const filters = [
    Tag.IN_ENGLISH,
    Tag.BEGINNER_FRIENDLY,
    Tag.SUITABLE_UNDER_10,
    Tag.AGE_RESTRICTED,
  ];

  const memoizedGames = useMemo(() => {
    return (
      <AllGamesList
        games={getVisibleGames(
          filteredGames,
          hiddenGames,
          selectedView,
          selectedTag
        )}
      />
    );
  }, [filteredGames, hiddenGames, selectedView, selectedTag]);

  const setView = (view: SelectedView): void => {
    setSelectedView(view);
    sessionStorage.setItem(SessionStorageValue.ALL_GAMES_SELECTED_VIEW, view);
  };

  return (
    <>
      <AllGamesVisibilityBar>
        <AllGamesToggleVisibility>
          <Button
            onClick={() => setView(SelectedView.UPCOMING)}
            buttonStyle={
              selectedView === SelectedView.UPCOMING
                ? ButtonStyle.DISABLED
                : ButtonStyle.NORMAL
            }
          >
            {t("upcomingGames")}
          </Button>

          <Button
            onClick={() => setView(SelectedView.ALL)}
            buttonStyle={
              selectedView === SelectedView.ALL
                ? ButtonStyle.DISABLED
                : ButtonStyle.NORMAL
            }
          >
            {t("allGames")}
          </Button>

          {activeProgramType === ProgramType.TABLETOP_RPG && (
            <Button
              onClick={() => setView(SelectedView.REVOLVING_DOOR)}
              buttonStyle={
                selectedView === SelectedView.REVOLVING_DOOR
                  ? ButtonStyle.DISABLED
                  : ButtonStyle.NORMAL
              }
            >
              {t("revolvingDoor")}
            </Button>
          )}
        </AllGamesToggleVisibility>

        <TagsDropdown>
          <ChooseTagsInstruction>{t("chooseTag")} </ChooseTagsInstruction>
          <select
            onChange={(event: ChangeEvent<HTMLSelectElement>) => {
              const tag = event.target.value;
              setSelectedTag(tag);
              sessionStorage.setItem(SessionStorageValue.ALL_GAMES_TAG, tag);
            }}
            value={selectedTag}
          >
            <option value="">{t("allGames")}</option>

            {filters.map((filter) => {
              return (
                <option key={filter} value={filter}>
                  {t(`gameTags.${filter}`)}
                </option>
              );
            })}
          </select>
        </TagsDropdown>
      </AllGamesVisibilityBar>

      {selectedView === SelectedView.REVOLVING_DOOR && (
        <>
          <RevolvingDoorInstruction>
            {t("revolvingDoorInstruction")}
          </RevolvingDoorInstruction>
          <div>
            <h3>{t("currentlyRunningRevolvingDoor")}</h3>
            {getRunningRevolvingDoorGames(activeGames, t)}
          </div>
        </>
      )}

      <Input
        type="text"
        value={searchTerm}
        onChange={(event) => setSearchTerm(event.target.value)}
        placeholder={t("findSignupOrGameSystem")}
        resetValue={() => setSearchTerm("")}
      />

      {loading ? <Loading /> : memoizedGames}
    </>
  );
};

const GameListShortDescription = styled.p`
  font-size: ${(props) => props.theme.fontSizeSmall};
  font-style: italic;
  margin: 4px 0 8px 14px;
`;

const AllGamesVisibilityBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;

  @media (max-width: ${(props) => props.theme.breakpointPhone}) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const ChooseTagsInstruction = styled.span`
  @media (max-width: ${(props) => props.theme.breakpointPhone}) {
    display: none;
  }
`;

const getVisibleGames = (
  games: readonly Game[],
  hiddenGames: readonly Game[],
  selectedView: SelectedView,
  selectedTag: string
): readonly Game[] => {
  const filteredGames = getTagFilteredGames(games, selectedTag);

  const visibleGames = filteredGames.filter((game) => {
    const hidden = hiddenGames.find(
      (hiddenGame) => game.gameId === hiddenGame.gameId
    );
    if (!hidden) return game;
  });

  if (selectedView === SelectedView.UPCOMING) {
    return getUpcomingGames(visibleGames);
  } else if (selectedView === SelectedView.REVOLVING_DOOR) {
    return getUpcomingGames(visibleGames).filter((game) => game.revolvingDoor);
  }

  return visibleGames;
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

const RevolvingDoorInstruction = styled.div`
  margin: 20px 0 0 14px;
`;

const AllGamesToggleVisibility = styled.div`
  button {
    margin: 10px 10px 0 0;
  }
`;

const TagsDropdown = styled.div`
  margin: 10px 0 0 0;
`;
