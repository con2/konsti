import React, { ReactElement } from 'react';
import { TFunction, useTranslation } from 'react-i18next';
import _ from 'lodash';
import styled from 'styled-components';
import { timeFormatter } from 'client/utils/timeFormatter';
import { GameEntry } from './GameEntry';
import { useAppSelector } from 'client/utils/hooks';
import { SelectedGame } from 'shared/typings/models/user';
import { sharedConfig } from 'shared/config/sharedConfig';
import { SignupStrategy } from 'shared/config/sharedConfig.types';
import { Game } from 'shared/typings/models/game';
import { GameSignups } from 'shared/typings/api/games';

export interface Props {
  games: readonly Game[];
}

export const AllGamesList = ({ games }: Props): ReactElement => {
  const { t } = useTranslation();

  const signups = useAppSelector((state) => state.allGames.signups);
  const signedGames = useAppSelector((state) => state.myGames.signedGames);
  const enteredGames = useAppSelector((state) => state.myGames.enteredGames);

  const GamesList = buildGamesList(
    games,
    signups,
    signedGames,
    enteredGames,
    t
  );

  return (
    <div className='games-list'>
      {games.length === 0 && <h3>{t('noProgramItemsAvailable')}</h3>}
      {games.length !== 0 && GamesList}
    </div>
  );
};

const buildGamesList = (
  games: readonly Game[],
  signups: readonly GameSignups[],
  signedGames: readonly SelectedGame[],
  enteredGames: readonly SelectedGame[],
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

    const allGamesRevolvingDoor = gamesList.every(
      (game) => game?.revolvingDoor
    );
    const signedGamesCount = signedGames.filter(
      (game) => game.gameDetails.startTime === startTime
    ).length;
    const signedGame = enteredGames.find(
      (game) => game.gameDetails.startTime === startTime
    );

    const getHeaderGameInfo = (): JSX.Element => {
      if (sharedConfig.signupStrategy === SignupStrategy.DIRECT) {
        return (
          <SignupCount>
            {signedGame ? signedGame.gameDetails.title : ''}
          </SignupCount>
        );
      }

      return <SignupCount>{signedGamesCount} / 3</SignupCount>;
    };

    const title = (
      <GameListTitle key={startTime}>
        <span className='game-startup-time'>{formattedStartTime}</span>
        {!allGamesRevolvingDoor && (
          <span className='game-signup-time'>
            {' '}
            ({t('signupOpenBetween')} {signupStartTime}-{signupEndTime})
          </span>
        )}
        {getHeaderGameInfo()}
      </GameListTitle>
    );

    GamesList.push(title);

    const gameEntries = gamesList.map((game) => {
      const gameSignups = signups.find(
        (gameSignup) => gameSignup.gameId === game.gameId
      );
      return (
        <GameEntry
          key={game.gameId}
          game={game}
          players={gameSignups?.usernames.length ?? 0}
          startTime={startTime}
        />
      );
    });
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
  background: #fafafa;
  border-bottom: 1px solid #d5d5d5;
  box-shadow: 4px 4px 45px 4px #d5d5d5;
  color: #3d3d3d;
  position: sticky;
  top: 0;
`;
