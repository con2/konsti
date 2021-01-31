import React, { FC, ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import _ from 'lodash';
import styled from 'styled-components';
import { timeFormatter } from 'client/utils/timeFormatter';
import { Game } from 'shared/typings/models/game';
import { GameEntry } from './GameEntry';

export interface Props {
  games: readonly Game[];
}

export const AllGamesList: FC<Props> = (props: Props): ReactElement => {
  const { games } = props;
  const { t } = useTranslation();

  const buildGamesList = (games: readonly Game[]): ReactElement[] => {
    const sortedGames = _.sortBy(games, [
      (game) => game.startTime,
      (game) => game.title.toLowerCase(),
    ]);

    const groupedGames = _.groupBy(sortedGames, 'startTime');

    const GamesList: ReactElement[] = [];

    for (const [startTime, games] of Object.entries(groupedGames)) {
      const formattedStartTime = timeFormatter.weekdayAndTime({
        time: startTime,
        capitalize: true,
      });
      const signupStartTime = timeFormatter.startTime(startTime);
      const signupEndTime = timeFormatter.endTime(startTime);

      const allGamesRevolvingDoor = games.every((game) => game.revolvingDoor);

      const title = (
        <GameListTitle key={startTime}>
          <span className='game-startup-time'>{formattedStartTime}</span>
          {!allGamesRevolvingDoor && (
            <span className='game-signup-time'>
              {' '}
              ({t('signupOpenBetween')} {signupStartTime}-{signupEndTime})
            </span>
          )}
        </GameListTitle>
      );

      GamesList.push(title);

      const gameEntries = games.map((game) => (
        <GameEntry key={game.gameId} game={game} />
      ));
      GamesList.push(...gameEntries);
    }

    return GamesList;
  };

  const GamesList = buildGamesList(games);

  return (
    <div className='games-list'>
      {games.length === 0 && <h3>{t('noProgramItemsAvailable')}</h3>}
      {games.length !== 0 && <>{GamesList}</>}
    </div>
  );
};

const GameListTitle = styled.h3`
  margin: 20px 0;
  padding: 8px;
  background-color: #04080f;
  color: white;
  position: sticky;
  top: 0;
`;
