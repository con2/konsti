import { ReactElement, useState } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { DirectSignup } from "shared/types/models/user";
import { useAppDispatch, useAppSelector } from "client/utils/hooks";
import {
  DeleteDirectSignupErrorMessage,
  submitDeleteDirectSignup,
} from "client/views/my-program-items/myProgramItemsThunks";
import { CancelSignupForm } from "client/views/program-item/signup/components/CancelSignupForm";
import { loadProgramItems } from "client/utils/loadData";
import { config } from "shared/config";
import { getShortWeekdayAndTime } from "client/utils/timeFormatter";
import { TertiaryButton } from "client/components/TertiaryButton";
import {
  MyProgramButtonContainer,
  MyProgramGameTitle,
  MyProgramListItem,
} from "client/views/my-program-items/components/shared";
import { ErrorMessage } from "client/components/ErrorMessage";
import { InfoText, InfoTextVariant } from "client/components/InfoText";
import { AppRoute } from "client/app/AppRoutes";

interface Props {
  signup: DirectSignup;
  startTime: string;
}

export const DirectSignupItem = ({
  signup,
  startTime,
}: Props): ReactElement | null => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const username = useAppSelector((state) => state.login.username);
  const signupQuestions = useAppSelector(
    (state) => state.admin.signupQuestions,
  );

  const [loading, setLoading] = useState(false);
  const [cancelSignupFormOpen, setCancelSignupFormOpen] = useState(false);
  const [serverError, setServerError] =
    useState<DeleteDirectSignupErrorMessage | null>(null);

  const signupQuestion = signupQuestions.find(
    (question) => question.programItemId === signup.programItem.programItemId,
  );

  const removeSignup = async (): Promise<void> => {
    setLoading(true);
    const errorMessage = await dispatch(
      submitDeleteDirectSignup({
        username,
        directSignupProgramItemId: signup.programItem.programItemId,
      }),
    );

    if (errorMessage) {
      setServerError(errorMessage);
    } else {
      // TODO: Don't reload program items, backend response should return all required data
      await loadProgramItems();
      setCancelSignupFormOpen(false);
    }
    setLoading(false);
  };

  if (signup.programItem.startTime !== startTime) {
    return null;
  }

  return (
    <MyProgramListItem>
      <MyProgramGameTitle data-testid="program-item-title">
        {signup.programItem.title}
      </MyProgramGameTitle>

      {!!signupQuestion && (
        <SignupQuestion>
          <FontAwesomeIcon icon={["far", "comment"]} aria-hidden="true" />
          {` ${t("myProgramView.yourAnswer")} "${
            i18n.language === "fi"
              ? signupQuestion.questionFi
              : signupQuestion.questionEn
          }"${
            signupQuestion.private
              ? ` (${t("privateOnlyVisibleToOrganizers")})`
              : ""
          }: ${signup.message}`}
        </SignupQuestion>
      )}

      {signup.time !== signup.programItem.startTime && (
        <StyledInfoText variant={InfoTextVariant.WARNING}>
          {t("myProgramView.startingTimeChanged")}{" "}
          {getShortWeekdayAndTime(signup.time)}{" "}
          <FontAwesomeIcon icon="arrow-right" />{" "}
          {getShortWeekdayAndTime(signup.programItem.startTime)}
        </StyledInfoText>
      )}

      {serverError && (
        <StyledErrorMessage
          message={t(serverError)}
          closeError={() => setServerError(null)}
        />
      )}

      {!cancelSignupFormOpen && (
        <StyledButtonContainer>
          <TertiaryButton
            icon="circle-arrow-right"
            onClick={async () => {
              await navigate(
                `${AppRoute.PROGRAM_ITEM}/${signup.programItem.programItemId}`,
              );
            }}
          >
            {t("button.showInfo")}
          </TertiaryButton>
          <TertiaryButton
            icon="ticket"
            onClick={async () => {
              await navigate(
                `${AppRoute.PROGRAM_ITEM}/${signup.programItem.programItemId}/admission`,
              );
            }}
          >
            {t("button.showAdmissionTicket")}
          </TertiaryButton>
          {config.event().signupOpen && (
            <TertiaryButton
              icon="calendar-xmark"
              onClick={() => setCancelSignupFormOpen(true)}
            >
              {t("button.cancelSignup")}
            </TertiaryButton>
          )}
        </StyledButtonContainer>
      )}

      {config.event().signupOpen && cancelSignupFormOpen && (
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
    </MyProgramListItem>
  );
};

const StyledInfoText = styled(InfoText)`
  margin: 4px 0 8px 0;
`;

const StyledErrorMessage = styled(ErrorMessage)`
  margin: 4px 0 8px 0;
`;

const SignupQuestion = styled.p`
  padding: 0;
  margin: 8px 0 4px 0;
  color: ${(props) => props.theme.textSecondary};
`;

const CancelSignupFormContainer = styled.div`
  display: flex;

  @media (max-width: ${(props) => props.theme.breakpointPhone}) {
    flex-direction: column;
    margin-left: -16px;
  }
`;

const StyledButtonContainer = styled(MyProgramButtonContainer)`
  @media (max-width: ${(props) => props.theme.breakpointPhone}) {
    flex-direction: column;
    align-items: flex-start;
  }
`;
