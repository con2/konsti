import _ from 'lodash';
import React, { ReactElement, useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { timeFormatter } from 'client/utils/timeFormatter';
import { useAppSelector } from 'client/utils/hooks';
import { getUsernamesForGameId } from 'client/views/results/resultsUtils';
import { getUpcomingGames } from 'client/utils/getUpcomingGames';
import { Button } from 'client/components/Button';

export const DirectResults = (): ReactElement => {
  const { t } = useTranslation();

  const games = useAppSelector((state) => state.allGames.games);
  const signups = useAppSelector((state) => state.allGames.signups);

  const [showAllGames, setShowAllGames] = useState<boolean>(false);
  const filteredGames = showAllGames ? games : getUpcomingGames(games, 1);
  const gamesByStartTime = _.groupBy(filteredGames, 'startTime');

  return (
    <div className='results-view'>
      <h2>{t('resultsView.allSignupResults')}</h2>

      <div className='my-games-toggle-visibility'>
        <Button onClick={() => setShowAllGames(false)} disabled={!showAllGames}>
          {t('lastStartedAndUpcomingGames')}
        </Button>
        <Button onClick={() => setShowAllGames(true)} disabled={showAllGames}>
          {t('allGames')}
        </Button>
      </div>

      {Object.entries(gamesByStartTime).map(([startTime, gamesForTime]) => {
        const formattedTime = timeFormatter.getWeekdayAndTime({
          time: startTime,
          capitalize: true,
        });
        return (
          <TimeSlot key={startTime}>
            <h3>{formattedTime}</h3>

            {gamesForTime.map((game) => {
              const usernames = getUsernamesForGameId(game.gameId, signups);
              return (
                <div key={game.gameId}>
                  <h4
                    key={game.gameId}
                  >{`${game.title} (${usernames.length}/${game.maxAttendance})`}</h4>
                  <ResultPlayerList>
                    {usernames.length > 0
                      ? usernames.map((username) => (
                          <p key={username}>{username}</p>
                        ))
                      : t('resultsView.noSignups')}
                  </ResultPlayerList>
                </div>
              );
            })}
          </TimeSlot>
        );
      })}
    </div>
  );
};

const TimeSlot = styled.div`
  padding: 0 0 20px 0;
`;

const ResultPlayerList = styled.div`
  padding-left: 30px;
`;
