import React, {
  ReactElement,
  ChangeEvent,
  useState,
  useEffect,
  useMemo,
} from "react";
import { useStore } from "react-redux";
import { Link } from "react-router-dom";
import { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
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
import { ControlledInput } from "client/components/ControlledInput";
import { SessionStorageValue } from "client/utils/localStorage";
import { Dropdown } from "client/components/Dropdown";
import { ButtonGroup } from "client/components/ButtonGroup";

export const MULTIPLE_WHITESPACES_REGEX = /\s\s+/g;

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

  const activeVisibleGames = activeGames.filter((game) => {
    const hidden = hiddenGames.find(
      (hiddenGame) => game.gameId === hiddenGame.gameId
    );
    if (!hidden) return game;
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
          .replace(MULTIPLE_WHITESPACES_REGEX, " ")
          .toLocaleLowerCase()
          .includes(debouncedSearchTerm.toLocaleLowerCase()) ||
        activeGame.gameSystem
          .replace(MULTIPLE_WHITESPACES_REGEX, " ")
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

  const options = [
    {
      value: "",
      title: t("allProgramItems", {
        PROGRAM_TYPE: t(`programTypePlural.${activeProgramType}`),
      }),
    },
    filters.map((filter) => ({
      value: filter,
      title: t(`gameTags.${filter}`),
    })),
  ].flat();

  const setView = (view: SelectedView): void => {
    setSelectedView(view);
    sessionStorage.setItem(SessionStorageValue.ALL_GAMES_SELECTED_VIEW, view);
  };

  return (
    <>
      <HeaderContainer>
        <ButtonGroup>
          <Button
            disabled={selectedView === SelectedView.UPCOMING}
            buttonStyle={ButtonStyle.SECONDARY}
            onClick={() => setView(SelectedView.UPCOMING)}
          >
            {t("upcoming")}
          </Button>

          <Button
            disabled={selectedView === SelectedView.ALL}
            buttonStyle={ButtonStyle.SECONDARY}
            onClick={() => setView(SelectedView.ALL)}
          >
            {t("all")}
          </Button>

          {activeProgramType === ProgramType.TABLETOP_RPG && (
            <Button
              disabled={selectedView === SelectedView.REVOLVING_DOOR}
              buttonStyle={ButtonStyle.SECONDARY}
              onClick={() => setView(SelectedView.REVOLVING_DOOR)}
            >
              {t("revolvingDoor")}
            </Button>
          )}
        </ButtonGroup>

        <div>
          <ChooseTagsInstruction>{t("chooseTag")} </ChooseTagsInstruction>
          <Dropdown
            onChange={(event: ChangeEvent<HTMLSelectElement>) => {
              const tag = event.target.value;
              setSelectedTag(tag);
              sessionStorage.setItem(SessionStorageValue.ALL_GAMES_TAG, tag);
            }}
            options={options}
            selectedValue={selectedTag}
          />
        </div>
        {selectedView === SelectedView.REVOLVING_DOOR && (
          <>
            <RevolvingDoorInstruction>
              {t("revolvingDoorInstruction")}
            </RevolvingDoorInstruction>
            <div>
              <h3>{t("currentlyRunningRevolvingDoor")}</h3>
              {getRunningRevolvingDoorGames(activeVisibleGames, t)}
            </div>
          </>
        )}

        <ControlledInput
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder={t("searchWithTitle", {
            context: activeProgramType,
            PROGRAM_TYPE: t(`programTypeGenetive.${activeProgramType}`),
          })}
          resetValue={() => setSearchTerm("")}
        />
      </HeaderContainer>
      {loading ? <Loading /> : memoizedGames}
    </>
  );
};

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

const HeaderContainer = styled.div`
  display: flex;
  gap: 8px;
  flex-direction: column;
`;

const ChooseTagsInstruction = styled.span`
  @media (max-width: ${(props) => props.theme.breakpointPhone}) {
    display: none;
  }
`;

const GameListShortDescription = styled.p`
  font-size: ${(props) => props.theme.fontSizeSmall};
  font-style: italic;
  margin: 4px 0 8px 14px;
`;

const RevolvingDoorInstruction = styled.div`
  margin: 6px 0 0 0;
  border: 1px solid ${(props) => props.theme.infoBorder};
  padding: 8px 6px;
  border-radius: 5px;
  border-left: 5px solid ${(props) => props.theme.infoBorder};
  background-color: ${(props) => props.theme.infoBackground};
`;
