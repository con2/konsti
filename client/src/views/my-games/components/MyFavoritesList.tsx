import React, { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import _ from "lodash";
import styled from "styled-components";
import { getStartTimes } from "client/utils/getStartTimes";
import { GamesByStartTimes } from "./GamesByStartTimes";
import { Game } from "shared/typings/models/game";

interface Props {
  favoritedGames: readonly Game[];
}

export const MyFavoritesList = ({ favoritedGames }: Props): ReactElement => {
  const { t } = useTranslation();

  const sortedGames: readonly Game[] = _.sortBy(favoritedGames, [
    (favoritedGame) => favoritedGame.startTime,
    (favoritedGame) => favoritedGame.title.toLowerCase(),
  ]);

  const startTimes = getStartTimes(favoritedGames);

  return (
    <div data-testid="favorited-games-list">
      <h3>{t("favoritedProgramItems")}</h3>
      <MyFavoritesGames>
        {favoritedGames.length === 0 && (
          <span>{t("noFavoritedProgramItems")}</span>
        )}
        {favoritedGames.length !== 0 && (
          <GamesByStartTimes games={sortedGames} startTimes={startTimes} />
        )}
      </MyFavoritesGames>
    </div>
  );
};

const MyFavoritesGames = styled.div`
  margin-left: 30px;

  @media (max-width: ${(props) => props.theme.breakpointPhone}) {
    margin-left: 10px;
  }
`;
