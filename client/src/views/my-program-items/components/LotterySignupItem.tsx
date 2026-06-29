import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { ReactElement, useState } from "react";
import { useAppDispatch } from "client/utils/hooks";
import { LotterySignupWithProgramItem } from "client/views/my-program-items/myProgramItemsSlice";
import {
  DeleteLotterySignupErrorMessage,
  submitDeleteLotterySignup,
} from "client/views/my-program-items/myProgramItemsThunks";
import {
  MyProgramButtonContainer,
  MyProgramGameTitle,
  MyProgramListItem,
} from "client/views/my-program-items/components/shared";
import { TertiaryButton } from "client/components/TertiaryButton";
import { AppRoute } from "client/app/AppRoutes";
import { PopularityInfo } from "client/components/PopularityInfo";
import { CancelSignupForm } from "client/views/program-item/signup/components/CancelSignupForm";
import { ErrorMessage } from "client/components/ErrorMessage";

interface Props {
  lotterySignup: LotterySignupWithProgramItem;
}

export const LotterySignupItem = ({ lotterySignup }: Props): ReactElement => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
  const [cancelSignupFormOpen, setCancelSignupFormOpen] = useState(false);
  const [serverError, setServerError] =
    useState<DeleteLotterySignupErrorMessage | null>(null);

  const removeSignup = async (): Promise<void> => {
    setLoading(true);
    const errorMessage = await dispatch(
      submitDeleteLotterySignup({
        lotterySignupProgramItemId: lotterySignup.programItemId,
      }),
    );

    if (errorMessage) {
      setServerError(errorMessage);
    } else {
      setCancelSignupFormOpen(false);
    }

    setLoading(false);
  };

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

        {serverError && (
          <StyledErrorMessage
            message={t(serverError)}
            closeError={() => setServerError(null)}
          />
        )}

        {!cancelSignupFormOpen && (
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
            <TertiaryButton
              icon="calendar-xmark"
              onClick={() => setCancelSignupFormOpen(true)}
            >
              {t("button.cancelSignup")}
            </TertiaryButton>
          </StyledButtons>
        )}

        {cancelSignupFormOpen && (
          <CancelSignupFormContainer>
            <CancelSignupForm
              onCancelForm={() => {
                setServerError(null);
                setCancelSignupFormOpen(false);
              }}
              onConfirmForm={async () => await removeSignup()}
              loading={loading}
            />
          </CancelSignupFormContainer>
        )}
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
  grid-row: 3;
`;

const StyledErrorMessage = styled(ErrorMessage)`
  grid-column: 1;
  grid-row: 2;
  margin: 4px 0 8px 0;
`;

const CancelSignupFormContainer = styled.div`
  grid-column: 1;
  grid-row: 3;
  display: flex;

  @media (max-width: ${(props) => props.theme.breakpointPhone}) {
    flex-direction: column;
    margin-left: -16px;
  }
`;

const StyledPopularityInfo = styled(PopularityInfo)`
  grid-column: 2;
  grid-row-start: 1;
  grid-row-end: 4;
  align-items: center;
  justify-content: center;

  @media (min-width: ${(props) => props.theme.breakpointPhone}) {
    justify-content: left;
    padding-left: 8px;
  }
`;
