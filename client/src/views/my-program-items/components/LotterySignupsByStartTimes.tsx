import { ReactElement } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { capitalize } from "lodash-es";
import { getWeekdayAndTime } from "client/utils/timeFormatter";
import { Signup } from "shared/types/models/user";
import { PopularityInfo } from "client/components/PopularityInfo";
import { AppRoute } from "client/app/AppRoutes";

interface Props {
  lotterySignups: Signup[];
  startTimes: readonly string[];
}

export const LotterySignupsByStartTimes = ({
  lotterySignups,
  startTimes,
}: Props): ReactElement => {
  return (
    <div>
      {startTimes.map((startTime) => {
        return (
          <div key={startTime}>
            <StyledTime>{capitalize(getWeekdayAndTime(startTime))}</StyledTime>

            <ul>
              {lotterySignups.map((signup) => {
                if (signup.time === startTime) {
                  return (
                    <ProgramItemContainer
                      key={signup.programItem.programItemId}
                    >
                      <RowLeftSide>
                        <SignupPriority>{`${signup.priority})`}</SignupPriority>
                        <StyledLink
                          to={`${AppRoute.PROGRAM_ITEM}/${signup.programItem.programItemId}`}
                        >
                          {signup.programItem.title}
                        </StyledLink>
                      </RowLeftSide>
                      <PopularityContainer>
                        <PopularityInfo
                          minAttendance={signup.programItem.minAttendance}
                          maxAttendance={signup.programItem.maxAttendance}
                          popularity={signup.programItem.popularity}
                          includeMsg={false}
                        />
                      </PopularityContainer>
                    </ProgramItemContainer>
                  );
                }
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
};

const ProgramItemContainer = styled.li`
  display: flex;
  flex-direction: row;
  margin-bottom: 8px;
  list-style: none;

  @media (max-width: ${(props) => props.theme.breakpointPhone}) {
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
