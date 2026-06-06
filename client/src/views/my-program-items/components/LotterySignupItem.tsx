import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { ReactElement } from "react";
import { LotterySignupWithProgramItem } from "client/views/my-program-items/myProgramItemsSlice";
import {
  MyProgramButtonContainer,
  MyProgramGameTitle,
  MyProgramListItem,
} from "client/views/my-program-items/components/shared";
import { TertiaryButton } from "client/components/TertiaryButton";
import { AppRoute } from "client/app/AppRoutes";
import { PopularityInfo } from "client/components/PopularityInfo";

interface Props {
  lotterySignup: LotterySignupWithProgramItem;
}

export const LotterySignupItem = ({ lotterySignup }: Props): ReactElement => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <MyProgramListItem>
      <Grid>
        <StyledTitle data-testid="program-item-title">
          {`${lotterySignup.priority}) ${lotterySignup.programItem.title}`}
        </StyledTitle>

        <StyledPopularityInfo
          popularity={lotterySignup.programItem.popularity}
          includeMsg={false}
          programType={lotterySignup.programItem.programType}
        />

        <StyledButtons>
          <TertiaryButton
            icon="circle-arrow-right"
            onClick={async () => {
              await navigate(
                `${AppRoute.PROGRAM_ITEM}/${lotterySignup.programItemId}`,
              );
            }}
          >
            {t("button.showInfo")}
          </TertiaryButton>
        </StyledButtons>
      </Grid>
    </MyProgramListItem>
  );
};

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 40px;
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
