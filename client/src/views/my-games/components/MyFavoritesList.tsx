import React, { FC, ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import _ from 'lodash';
import styled from 'styled-components';
import { getStartTimes } from 'utils/getStartTimes';
import { GamesByStartTimes } from './GamesByStartTimes';
import { Game } from 'typings/game.typings';

export interface Props {
  favoritedGames: readonly Game[];
}

export const MyFavoritesList: FC<Props> = (props: Props): ReactElement => {
  const { favoritedGames } = props;
  const { t } = useTranslation();

  const sortedGames: readonly Game[] = _.sortBy(favoritedGames, [
    (favoritedGame) => favoritedGame.startTime,
    (favoritedGame) => favoritedGame.title.toLowerCase(),
  ]);

  const startTimes = getStartTimes(favoritedGames);

  return (
    <div className='my-favorites-list'>
      <h3>{t('favoritedGames')}</h3>
      <MyFavoritesGames>
        {favoritedGames.length === 0 && <span>{t('noFavoritedGames')}</span>}
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
