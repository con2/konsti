import _ from 'lodash';
import React, { ReactElement } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { timeFormatter } from 'client/utils/timeFormatter';
import { useAppSelector } from 'client/utils/hooks';
import { getUsernamesForGameId } from 'client/views/results/resultsUtils';

export const DirectResults = (): ReactElement => {
  const { t } = useTranslation();

  const games = useAppSelector((state) => state.allGames.games);
  const signups = useAppSelector((state) => state.allGames.signups);

  const gamesByStartTime = _.groupBy(games, 'startTime');

  return (
    <div className='results-view'>
      <h2>{t('resultsView.allSignupResults')}</h2>

      {Object.entries(gamesByStartTime).map(([startTime, gamesForTime]) => {
        return (
          <div key={startTime}>
            <h3>
              {timeFormatter.getWeekdayAndTime({
                time: startTime,
                capitalize: true,
              })}
            </h3>

            {gamesForTime.map((game) => {
              const usernames = getUsernamesForGameId(game.gameId, signups);
              return (
                <div key={game.gameId}>
                  <h4
                    key={game.gameId}
                  >{`${game.title} (${usernames.length}/${game.maxAttendance})`}</h4>
                  <ResultPlayerList>
                    {usernames.map((username) => (
                      <p key={username}>{username}</p>
                    ))}
                  </ResultPlayerList>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

const ResultPlayerList = styled.div`
  padding-left: 30px;
`;
