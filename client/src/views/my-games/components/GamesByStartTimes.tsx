import React, { FC, ReactElement } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { timeFormatter } from 'utils/timeFormatter';
import { Game } from 'typings/game.typings';

export interface Props {
  games: readonly Game[];
  startTimes: readonly string[];
}

export const GamesByStartTimes: FC<Props> = (props: Props): ReactElement => {
  const { games, startTimes } = props;

  const getGamesList = (startTime: string): Array<ReactElement | undefined> => {
    return games.map((game) => {
      if (game.startTime === startTime) {
        return (
          <GameDetailsList key={game.gameId}>
            <Link to={`/games/${game.gameId}`}>{game.title} </Link>
          </GameDetailsList>
        );
      }
    });
  };

  const startTimesList = startTimes.map((startTime) => {
    return (
      <div key={startTime}>
        <p className='bold'>
          {timeFormatter.weekdayAndTime({ time: startTime, capitalize: true })}
        </p>
        {getGamesList(startTime)}
      </div>
    );
  });

  return <div className='start-times-list'>{startTimesList}</div>;
};

const GameDetailsList = styled.p`
  padding-left: 30px;
`;
