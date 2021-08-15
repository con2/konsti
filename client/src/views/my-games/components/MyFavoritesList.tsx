import React, { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import _ from "lodash";
import styled from "styled-components";
import { getStartTimes } from "client/utils/getStartTimes";
import { GamesByStartTimes } from "./GamesByStartTimes";
import { Game } from "shared/typings/models/game";

export interface Props {
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
    <div>
      <h3>{t("favoritedGames")}</h3>
      <MyFavoritesGames>
        {favoritedGames.length === 0 && <span>{t("noFavoritedGames")}</span>}
        {favoritedGames.length !== 0 && (
          <GamesByStartTimes games={sortedGames} startTimes={startTimes} />
        )}
      </MyFavoritesGames>
    </div>
  );
};

const MyFavoritesGames = styled.div`
  padding-left: 30px;
`;
