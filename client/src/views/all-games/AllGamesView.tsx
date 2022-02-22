import React, { ReactElement, ChangeEvent, useState, useEffect } from "react";
import { useStore } from "react-redux";
import { Link } from "react-router-dom";
import { TFunction, useTranslation } from "react-i18next";
import moment from "moment";
import styled from "styled-components";
import { AllGamesList } from "client/views/all-games/components/AllGamesList";
import { getUpcomingGames } from "client/utils/getUpcomingGames";
import { loadGames } from "client/utils/loadData";
import { config } from "client/config";
import { Loading } from "client/components/Loading";
import { Game } from "shared/typings/models/game";
import { getTime } from "client/utils/getTime";
import { useAppSelector } from "client/utils/hooks";
import { Button } from "client/components/Button";

export const AllGamesView = (): ReactElement => {
  const { t } = useTranslation();

  const games = useAppSelector((state) => state.allGames.games);
  const testTime = useAppSelector((state) => state.testSettings.testTime);
  const hiddenGames = useAppSelector((state) => state.admin.hiddenGames);

  const [selectedView, setSelectedView] = useState<string>("upcoming");
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
  }, [store, testTime]);

  const visibleTags = [
    "tabletopRPG",
    "larp",
    "in-english",
    "aloittelijaystavallinen",
    "childrensProgram",
    "suitableUnder7",
    "suitable7to12",
    "suitableOver12",
    "notSuitableUnder15",
    "ageRestricted",
  ];

  return (
    <>
      <AllGamesVisibilityBar>
        <AllGamesToggleVisibility>
          <Button
            onClick={() => setSelectedView("upcoming")}
            disabled={selectedView === "upcoming"}
          >
            {t("upcomingGames")}
          </Button>

          <Button
            onClick={() => setSelectedView("all")}
            disabled={selectedView === "all"}
          >
            {t("allGames")}
          </Button>

          {config.revolvingDoorEnabled && (
            <Button
              onClick={() => setSelectedView("revolving-door")}
              disabled={selectedView === "revolving-door"}
            >
              {t("revolvingDoor")}
            </Button>
          )}
        </AllGamesToggleVisibility>

        {config.tagFilteringEnabled && (
          <TagsDropdown>
            <ChooseTagsInstruction>{t("chooseTag")} </ChooseTagsInstruction>
            <select
              onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                setSelectedTag(event.target.value)
              }
              value={selectedTag}
            >
              <option value="">{t("allGames")}</option>

              {visibleTags.map((tag) => {
                return (
                  <option key={tag} value={tag}>
                    {tag === "in-english" && t(`gameTags.inEnglish`)}
                    {tag === "aloittelijaystavallinen" &&
                      t(`gameTags.beginnerFriendly`)}
                    {tag === "sopii-lapsille" && t(`gameTags.childrenFriendly`)}
                    {tag === "tabletopRPG" && t(`programType.tabletopRPG`)}
                    {tag === "larp" && t(`programType.larp`)}
                    {tag === "suitableUnder7" && t(`gameTags.suitableUnder7`)}
                    {tag === "suitable7to12" && t(`gameTags.suitable7to12`)}
                    {tag === "suitableOver12" && t(`gameTags.suitableOver12`)}
                    {tag === "notSuitableUnder15" &&
                      t(`gameTags.notSuitableUnder15`)}
                    {tag === "ageRestricted" && t(`gameTags.ageRestricted`)}
                    {tag === "childrensProgram" &&
                      t(`gameTags.childrensProgram`)}
                  </option>
                );
              })}
            </select>
          </TagsDropdown>
        )}
      </AllGamesVisibilityBar>

      {selectedView === "revolving-door" && (
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
  selectedView: string,
  selectedTag: string
): readonly Game[] => {
  const filteredGames = getTagFilteredGames(games, selectedTag);

  const visibleGames = filteredGames.filter((game) => {
    const hidden = hiddenGames.find(
      (hiddenGame) => game.gameId === hiddenGame.gameId
    );
    if (!hidden) return game;
  });

  if (selectedView === "upcoming") {
    return getUpcomingGames(visibleGames);
  } else if (selectedView === "revolving-door") {
    return getUpcomingGames(visibleGames).filter((game) => game.revolvingDoor);
  }

  return visibleGames;
};

const getTagFilteredGames = (
  games: readonly Game[],
  selectedTag: string
): readonly Game[] => {
  if (!selectedTag) return games;

  if (selectedTag === "aloittelijaystavallinen") {
    return games.filter(
      (game) =>
        game.beginnerFriendly || game.tags.includes("aloittelijaystavallinen")
    );
  } else if (selectedTag === "tabletopRPG") {
    return games.filter((game) => game.programType === "tabletopRPG");
  } else if (selectedTag === "larp") {
    return games.filter((game) => game.programType === "larp");
  } else if (selectedTag === "in-english") {
    return games.filter((game) => game.tags.includes("in-english"));
  } else if (selectedTag === "childrensProgram") {
    return games.filter((game) => game.tags.includes("lastenohjelma"));
  } else if (selectedTag === "suitableUnder7") {
    return games.filter((game) => game.tags.includes("sopii-alle-7v-"));
  } else if (selectedTag === "suitable7to12") {
    return games.filter((game) => game.tags.includes("sopii-7-12v-"));
  } else if (selectedTag === "suitableOver12") {
    return games.filter((game) => game.tags.includes("sopii-yli-12v-"));
  } else if (selectedTag === "notSuitableUnder15") {
    return games.filter((game) => game.tags.includes("ei-sovellu-alle-15v-"));
  } else if (selectedTag === "ageRestricted") {
    return games.filter((game) => game.tags.includes("vain-taysi-ikaisille"));
  }

  return games;
};

const getRunningRevolvingDoorGames = (
  games: readonly Game[],
  t: TFunction
): ReactElement | ReactElement[] => {
  const timeNow = getTime();
  const runningGames = games.filter((game) => {
    return (
      game.revolvingDoor &&
      moment(game.startTime).isBefore(timeNow) &&
      moment(game.endTime).isAfter(timeNow)
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
