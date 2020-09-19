import React, { FC, ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import _ from 'lodash';
import { timeFormatter } from 'utils/timeFormatter';
import { Game } from 'typings/game.typings';

export interface Props {
  hiddenGames: readonly Game[];
}

export const Hidden: FC<Props> = (props: Props): ReactElement => {
  const { hiddenGames } = props;
  const { t } = useTranslation();

  const sortedGames = _.sortBy(hiddenGames, [
    (hiddenGame) => hiddenGame.title.toLowerCase(),
  ]);

  const GamesList = sortedGames.map((game) => (
    <li key={game.gameId}>
      <Link to={`/games/${game.gameId}`}>{game.title}</Link>
      {' - '}
      {timeFormatter.weekdayAndTime({
        time: game.startTime,
        capitalize: false,
      })}
    </li>
  ));

  return (
    <div className='hidden'>
      <h3>{t('hiddenGames')}</h3>
      <ul>
        {!hiddenGames && <span>{t('noHiddenGames')}</span>}
        {GamesList}
      </ul>
    </div>
  );
};
