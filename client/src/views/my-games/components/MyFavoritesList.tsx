import { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import _ from "lodash";
import styled from "styled-components";
import { getStartTimes } from "client/utils/getStartTimes";
import { FavoritesByStartTimes } from "./FavoritesByStartTimes";
import { Game } from "shared/typings/models/game";
import { RaisedCard } from "client/components/RaisedCard";

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
    <RaisedCard data-testid="favorited-games-list">
      <Header>{t("favoritedProgramItems")}</Header>
      <div>
        {favoritedGames.length === 0 && (
          <span>{t("noFavoritedProgramItems")}</span>
        )}
        {favoritedGames.length !== 0 && (
          <FavoritesByStartTimes games={sortedGames} startTimes={startTimes} />
        )}
      </div>
    </RaisedCard>
  );
};

const Header = styled.h3`
  margin: 0 0 12px 0;
`;
