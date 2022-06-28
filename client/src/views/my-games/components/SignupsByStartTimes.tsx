import React, { ReactElement } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { timeFormatter } from "client/utils/timeFormatter";
import { SelectedGame } from "shared/typings/models/user";

interface Props {
  signups: SelectedGame[];
  startTimes: readonly string[];
}

export const SignupsByStartTimes = ({
  signups,
  startTimes,
}: Props): ReactElement => {
  return (
    <div>
      {startTimes.map((startTime) => {
        return (
          <div key={startTime}>
            <StyledTime>
              {timeFormatter.getWeekdayAndTime({
                time: startTime,
                capitalize: true,
              })}
            </StyledTime>

            {signups.map((signup) => {
              if (signup.time === startTime) {
                return (
                  <GameDetailsList key={signup.gameDetails.gameId}>
                    {`${signup.priority}) `}
                    <Link to={`/games/${signup.gameDetails.gameId}`}>
                      {signup.gameDetails.title}
                    </Link>
                  </GameDetailsList>
                );
              }
            })}
          </div>
        );
      })}
    </div>
  );
};

const GameDetailsList = styled.p`
  padding-left: 30px;
`;

const StyledTime = styled.p`
  font-weight: 600;
  margin: 10px 0;
`;
