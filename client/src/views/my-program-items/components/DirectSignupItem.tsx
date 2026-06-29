import { ReactElement, useState } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useAppDispatch, useAppSelector } from "client/utils/hooks";
import {
  DeleteDirectSignupErrorMessage,
  submitDeleteDirectSignup,
} from "client/views/my-program-items/myProgramItemsThunks";
import { CancelSignupForm } from "client/views/program-item/signup/components/CancelSignupForm";
import { getShortWeekdayAndTime } from "shared/utils/timeFormatter";
import { TertiaryButton } from "client/components/TertiaryButton";
import {
  MyProgramButtonContainerMobile,
  MyProgramCancelSignupFormContainer,
  MyProgramErrorMessage,
  MyProgramGameTitle,
  MyProgramListItem,
} from "client/views/my-program-items/components/shared";
import { InfoText, InfoTextVariant } from "client/components/InfoText";
import { AppRoute } from "client/app/AppRoutes";
import { DirectSignupWithProgramItem } from "client/views/my-program-items/myProgramItemsSlice";
import { isStartTimeChanged } from "shared/utils/isStartTimeChanged";
import { SignupQuestionAnswer } from "client/components/SignUpQuestionAnswer";

interface Props {
  signup: DirectSignupWithProgramItem;
  startTime: string;
}

export const DirectSignupItem = ({
  signup,
  startTime,
}: Props): ReactElement | null => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const signupQuestions = useAppSelector(
    (state) => state.admin.signupQuestions,
  );

  const [loading, setLoading] = useState(false);
  const [cancelSignupFormOpen, setCancelSignupFormOpen] = useState(false);
  const [serverError, setServerError] =
    useState<DeleteDirectSignupErrorMessage | null>(null);

  const signupQuestion = signupQuestions.find(
    (question) => question.programItemId === signup.programItemId,
  );

  const removeSignup = async (): Promise<void> => {
    setLoading(true);
    const errorMessage = await dispatch(
      submitDeleteDirectSignup({
        directSignupProgramItemId: signup.programItemId,
      }),
    );

    if (errorMessage) {
      setServerError(errorMessage);
    } else {
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
        <SignupQuestionAnswer
          signupQuestion={signupQuestion}
          signupMessage={signup.message}
        />
      )}

      {isStartTimeChanged(
        signup.signedToStartTime,
        signup.programItem.startTime,
        signup.programItem.parentId,
      ) && (
        <StyledInfoText variant={InfoTextVariant.WARNING}>
          {t("myProgramView.startingTimeChanged")}{" "}
          {getShortWeekdayAndTime(signup.signedToStartTime)}{" "}
          <FontAwesomeIcon icon="arrow-right" />{" "}
          {getShortWeekdayAndTime(signup.programItem.startTime)}
        </StyledInfoText>
      )}

      {serverError && (
        <MyProgramErrorMessage
          message={t(serverError)}
          closeError={() => setServerError(null)}
        />
      )}

      {!cancelSignupFormOpen && (
        <MyProgramButtonContainerMobile>
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
          <TertiaryButton
            icon="ticket"
            onClick={async () => {
              await navigate(
                `${AppRoute.PROGRAM_ITEM}/${signup.programItemId}/admission`,
              );
            }}
          >
            {t("button.showAdmissionTicket")}
          </TertiaryButton>
          <TertiaryButton
            icon="calendar-xmark"
            onClick={() => setCancelSignupFormOpen(true)}
          >
            {t("button.cancelSignup")}
          </TertiaryButton>
        </MyProgramButtonContainerMobile>
      )}

      {cancelSignupFormOpen && (
        <MyProgramCancelSignupFormContainer>
          <CancelSignupForm
            onCancelForm={() => {
              setServerError(null);
              setCancelSignupFormOpen(false);
            }}
            onConfirmForm={async () => await removeSignup()}
            loading={loading}
          />
        </MyProgramCancelSignupFormContainer>
      )}
    </MyProgramListItem>
  );
};

const StyledInfoText = styled(InfoText)`
  margin: 4px 0 8px 0;
`;
