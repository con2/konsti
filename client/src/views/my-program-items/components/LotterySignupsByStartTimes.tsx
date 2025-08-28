import { Fragment, ReactElement } from "react";
import { useNavigate } from "react-router";
import styled from "styled-components";
import { capitalize, groupBy } from "remeda";
import { useTranslation } from "react-i18next";
import { getWeekdayAndTime } from "client/utils/timeFormatter";
import { PopularityInfo } from "client/components/PopularityInfo";
import {
  MyProgramButtonContainer,
  MyProgramGameTitle,
  MyProgramList,
  MyProgramListItem,
  MyProgramTime,
} from "client/views/my-program-items/components/shared";
import { TertiaryButton } from "client/components/TertiaryButton";
import { AppRoute } from "client/app/AppRoutes";
import { LotterySignupWithProgramItem } from "client/views/my-program-items/myProgramItemsSlice";
import { config } from "shared/config";

interface Props {
  lotterySignups: LotterySignupWithProgramItem[];
}

export const LotterySignupsByStartTimes = ({
  lotterySignups,
}: Props): ReactElement => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const groupedLotterySignups = groupBy(lotterySignups, (lotterySignup) => {
    const parentStartTime = config
      .event()
      .startTimesByParentIds.get(lotterySignup.programItem.parentId);
    return parentStartTime ?? lotterySignup.signedToStartTime;
  });

  return (
    <>
      {Object.entries(groupedLotterySignups).map(([startTime, signups]) => (
        <Fragment key={startTime}>
          <MyProgramTime>
            {capitalize(getWeekdayAndTime(startTime))}
          </MyProgramTime>

          <MyProgramList>
            {signups.map((signup) => (
              <MyProgramListItem key={signup.programItemId}>
                <Grid>
                  <StyledTitle data-testid="program-item-title">
                    {`${signup.priority}) ${signup.programItem.title}`}
                  </StyledTitle>

                  <StyledPopularityInfo
                    popularity={signup.programItem.popularity}
                    includeMsg={false}
                    programType={signup.programItem.programType}
                  />

                  <StyledButtons>
                    <TertiaryButton
                      icon="circle-arrow-right"
                      onClick={async () => {
                        await navigate(
                          `${AppRoute.PROGRAM_ITEM}/${signup.programItemId}`,
                        );
                      }}
                    >
                      {t("button.showInfo")}
                    </TertiaryButton>
                  </StyledButtons>
                </Grid>
              </MyProgramListItem>
            ))}
          </MyProgramList>
        </Fragment>
      ))}
    </>
  );
};

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 40px;
`;

const StyledPopularityInfo = styled(PopularityInfo)`
  grid-column: 2;
  grid-row-start: 1;
  grid-row-end: 3;
  align-items: center;
  justify-content: center;

  @media (min-width: ${(props) => props.theme.breakpointPhone}) {
    justify-content: left;
    padding-left: 8px;
  }
`;

const StyledTitle = styled(MyProgramGameTitle)`
  grid-column: 1;
  grid-row: 1;
  margin-top: 12px;
`;

const StyledButtons = styled(MyProgramButtonContainer)`
  grid-column: 1;
  grid-row: 2;
`;
