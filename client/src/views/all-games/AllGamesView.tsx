import React, { ReactElement, ChangeEvent, useState, useEffect } from "react";
import { useStore } from "react-redux";
import { Link } from "react-router-dom";
import { TFunction, useTranslation } from "react-i18next";
import dayjs from "dayjs";
import styled from "styled-components";
import { AllGamesList } from "client/views/all-games/components/AllGamesList";
import { getUpcomingGames } from "client/utils/getUpcomingGames";
import { loadGames } from "client/utils/loadData";
import { Loading } from "client/components/Loading";
import { Game, ProgramType, Tag } from "shared/typings/models/game";
import { getTime } from "client/utils/getTime";
import { useAppSelector } from "client/utils/hooks";
import { Button, ButtonStyle } from "client/components/Button";
import { selectActiveGames } from "client/views/admin/adminSlice";

enum SelectedView {
  ALL = "all",
  UPCOMING = "upcoming",
  REVOLVING_DOOR = "revolving-door",
}

export const AllGamesView = (): ReactElement => {
  const { t } = useTranslation();

  const games = useAppSelector(selectActiveGames);
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

  const store = useStore();

  useEffect(() => {
    setLoading(true);
    const fetchData = async (): Promise<void> => {
      await loadGames();
      setLoading(false);
    };
    fetchData();
  }, [store, testTime, signupStrategy]);

  const filters = [
    Tag.IN_ENGLISH,
    Tag.BEGINNER_FRIENDLY,
    Tag.CHILDRENS_PROGRAM,
    Tag.SUITABLE_UNDER_7,
    Tag.SUITABLE_7_TO_12,
    Tag.SUITABLE_OVER_12,
    Tag.NOT_SUITABLE_UNDER_15,
    Tag.AGE_RESTRICTED,
  ];

  return (
    <>
      <AllGamesVisibilityBar>
        <AllGamesToggleVisibility>
          <Button
            onClick={() => setSelectedView(SelectedView.UPCOMING)}
            buttonStyle={
              selectedView === SelectedView.UPCOMING
                ? ButtonStyle.DISABLED
                : ButtonStyle.NORMAL
            }
          >
            {t("upcomingGames")}
          </Button>

          <Button
            onClick={() => setSelectedView(SelectedView.ALL)}
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
              onClick={() => setSelectedView(SelectedView.REVOLVING_DOOR)}
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
            onChange={(event: ChangeEvent<HTMLSelectElement>) =>
              setSelectedTag(event.target.value)
            }
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
            {getRunningRevolvingDoorGames(games, t)}
          </div>
        </>
      )}

      {loading ? (
        <Loading />
      ) : (
        <AllGamesList
          games={getVisibleGames(games, hiddenGames, selectedView, selectedTag)}
        />
      )}
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
