import React, { ReactElement } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { timeFormatter } from "client/utils/timeFormatter";
import { SelectedGame } from "shared/typings/models/user";
import { PopularityInfo } from "client/components/PopularityInfo";

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
                  <GameDetailsContainer key={signup.gameDetails.gameId}>
                    <GameDetailsList>
                      {`${signup.priority}) `}
                      <Link to={`/games/${signup.gameDetails.gameId}`}>
                        {signup.gameDetails.title}
                      </Link>
                    </GameDetailsList>
                    <PopularityContainer>
                      <PopularityInfo
                        minAttendance={signup.gameDetails.minAttendance}
                        maxAttendance={signup.gameDetails.maxAttendance}
                        popularity={signup.gameDetails.popularity}
                        includeMsg={false}
                      />
                    </PopularityContainer>
                  </GameDetailsContainer>
                );
              }
            })}
          </div>
        );
      })}
    </div>
  );
};
const GameDetailsContainer = styled.div`
  display: flex;
  flex-direction: row;
`;

const GameDetailsList = styled.p`
  padding-left: 30px;
`;

const PopularityContainer = styled.div`
  margin-top: 15px;
  padding-left: 10px;
`;
const StyledTime = styled.p`
  font-weight: 600;
  margin: 10px 0;
`;
