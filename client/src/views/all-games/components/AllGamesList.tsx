import React, { FC, ReactElement } from 'react';
import { TFunction, useTranslation } from 'react-i18next';
import _ from 'lodash';
import styled from 'styled-components';
import { timeFormatter } from 'client/utils/timeFormatter';
import { Game } from 'shared/typings/models/game';
import { GameEntry } from './GameEntry';
import { useAppSelector } from 'client/utils/hooks';
import { SelectedGame } from 'shared/typings/models/user';

export interface Props {
  games: readonly Game[];
}

export const AllGamesList: FC<Props> = (props: Props): ReactElement => {
  const { games } = props;
  const { t } = useTranslation();

  const signedGames = useAppSelector((state) => state.myGames.signedGames);

  const GamesList = buildGamesList(games, signedGames, t);

  return (
    <div className='games-list'>
      {games.length === 0 && <h3>{t('noProgramItemsAvailable')}</h3>}
      {games.length !== 0 && { GamesList }}
    </div>
  );
};

const buildGamesList = (
  games: readonly Game[],
  signedGames: readonly SelectedGame[],
  t: TFunction
): ReactElement[] => {
  const sortedGames = _.sortBy(games, [
    (game) => game.startTime,
    (game) => game.title.toLowerCase(),
  ]);

  const groupedGames = _.groupBy(sortedGames, 'startTime');

  const GamesList: ReactElement[] = [];

  for (const [startTime, gamesList] of Object.entries(groupedGames)) {
    const formattedStartTime = timeFormatter.getWeekdayAndTime({
      time: startTime,
      capitalize: true,
    });
    const signupStartTime = timeFormatter.getStartTime(startTime);
    const signupEndTime = timeFormatter.getEndTime(startTime);

    const allGamesRevolvingDoor = gamesList.every((game) => game.revolvingDoor);
    const signedGamesCount = signedGames.filter(
      (game) => game.gameDetails.startTime === startTime
    ).length;

    const title = (
      <GameListTitle key={startTime}>
        <span className='game-startup-time'>{formattedStartTime}</span>
        {!allGamesRevolvingDoor && (
          <span className='game-signup-time'>
            {' '}
            ({t('signupOpenBetween')} {signupStartTime}-{signupEndTime})
          </span>
        )}
        <SignupCount>{signedGamesCount} / 3</SignupCount>
      </GameListTitle>
    );

    GamesList.push(title);

    const gameEntries = gamesList.map((game) => (
      <GameEntry key={game.gameId} game={game} startTime={startTime} />
    ));
    GamesList.push(...gameEntries);
  }

  return GamesList;
};

const SignupCount = styled.span`
  float: right;
`;

const GameListTitle = styled.h3`
  margin: 20px 0;
  padding: 8px;
  background-color: #fafafa;
  border-bottom: 1px solid #d5d5d5;
  box-shadow: 4px 4px 45px 4px #d5d5d5;
  color: #3d3d3d;
  position: sticky;
  top: 0;
`;
