import _ from 'lodash';
import React, { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { timeFormatter } from 'client/utils/timeFormatter';
import { useAppSelector } from 'client/utils/hooks';

export const DirectResults = (): ReactElement => {
  const { t } = useTranslation();

  const games = useAppSelector((state) => state.allGames.games);
  const gamesByStartTime = _.groupBy(games, 'startTime');

  return (
    <div className='results-view'>
      <h2>{t('resultsView.allSignupResults')}</h2>

      {Object.entries(gamesByStartTime).map(([startTime, gamesForTime]) => {
        return (
          <>
            <h3>
              {timeFormatter.getWeekdayAndTime({
                time: startTime,
                capitalize: true,
              })}
            </h3>

            {gamesForTime.map((game) => {
              return <p key={game.gameId}>{game.title}</p>;
            })}
          </>
        );
      })}
    </div>
  );
};
