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
                    <RowLeftSide>
                      <SignupPriority>{`${signup.priority})`}</SignupPriority>
                      <StyledLink to={`/games/${signup.gameDetails.gameId}`}>
                        {signup.gameDetails.title}
                      </StyledLink>
                    </RowLeftSide>
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
  margin: 0 0 6px 30px;

  @media (max-width: ${(props) => props.theme.breakpointPhone}) {
    margin-left: 10px;
    justify-content: space-between;
  }
`;

const RowLeftSide = styled.div`
  display: flex;
  flex-direction: row;
`;
const StyledLink = styled(Link)`
  display: flex;
  width: fit-content;
`;

const PopularityContainer = styled.div`
  margin-left: 10px;
`;

const StyledTime = styled.p`
  font-weight: 600;
  margin: 10px 0;
`;

const SignupPriority = styled.span`
  vertical-align: text-bottom;

  margin-right: 4px;
`;
