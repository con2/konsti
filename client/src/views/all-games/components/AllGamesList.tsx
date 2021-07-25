import React, { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import _ from 'lodash';
import styled from 'styled-components';
import { timeFormatter } from 'client/utils/timeFormatter';
import { GameEntry } from './GameEntry';
import { useAppSelector } from 'client/utils/hooks';
import { sharedConfig } from 'shared/config/sharedConfig';
import { SignupStrategy } from 'shared/config/sharedConfig.types';
import { Game } from 'shared/typings/models/game';

export interface Props {
  games: readonly Game[];
}

export const AllGamesList = ({ games }: Props): ReactElement => {
  const { t } = useTranslation();

  const signups = useAppSelector((state) => state.allGames.signups);
  const signedGames = useAppSelector((state) => state.myGames.signedGames);
  const enteredGames = useAppSelector((state) => state.myGames.enteredGames);

  const sortedGames = _.sortBy(games, [
    (game) => game.startTime,
    (game) => game.title.toLowerCase(),
  ]);

  const gamesByStartTime = _.groupBy(sortedGames, 'startTime');

  const gamesList = Object.entries(gamesByStartTime).map(
    ([startTime, gamesForStartTime]) => {
      const formattedStartTime = timeFormatter.getWeekdayAndTime({
        time: startTime,
        capitalize: true,
      });
      const signupStartTime = timeFormatter.getStartTime(startTime);
      const signupEndTime = timeFormatter.getEndTime(startTime);

      const allGamesRevolvingDoor = gamesForStartTime.every(
        (game) => game?.revolvingDoor
      );
      const signedGamesCount = signedGames.filter(
        (game) => game.gameDetails.startTime === startTime
      ).length;
      const signedGame = enteredGames.find(
        (game) => game.gameDetails.startTime === startTime
      );

      return (
        <>
          <GameListTitle key={startTime}>
            <span>{formattedStartTime}</span>

            {!allGamesRevolvingDoor &&
              sharedConfig.signupStrategy === SignupStrategy.ALGORITHM && (
                <span>
                  {' '}
                  ({t('signupOpenBetween')} {signupStartTime}-{signupEndTime})
                </span>
              )}

            {sharedConfig.signupStrategy === SignupStrategy.DIRECT ? (
              <SignupCount>
                {signedGame ? signedGame.gameDetails.title : ''}
              </SignupCount>
            ) : (
              <SignupCount>{signedGamesCount} / 3</SignupCount>
            )}
          </GameListTitle>

          {gamesForStartTime.map((game) => {
            const gameSignups = signups.find(
              (gameSignup) => gameSignup.gameId === game.gameId
            );

            return (
              <GameEntry
                key={game.gameId}
                game={game}
                players={gameSignups?.users.length ?? 0}
                startTime={startTime}
              />
            );
          })}
        </>
      );
    }
  );

  return (
    <div>
      {games.length === 0 && <h3>{t('noProgramItemsAvailable')}</h3>}
      {games.length !== 0 && gamesList}
    </div>
  );
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
