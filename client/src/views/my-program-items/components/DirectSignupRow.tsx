import { ReactElement, useState } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Signup } from "shared/types/models/user";
import { useAppDispatch, useAppSelector } from "client/utils/hooks";
import {
  DeleteDirectSignupErrorMessage,
  submitDeleteDirectSignup,
} from "client/views/my-program-items/myProgramItemsThunks";
import { CancelSignupForm } from "client/views/all-program-items/components/CancelSignupForm";
import { ErrorMessage } from "client/components/ErrorMessage";
import { loadProgramItems } from "client/utils/loadData";
import { config } from "shared/config";
import { IconButton } from "client/components/IconButton";
import { getShortWeekdayAndTime } from "client/utils/timeFormatter";

interface Props {
  signup: Signup;
  startTime: string;
}

export const DirectSignupRow = ({
  signup,
  startTime,
}: Props): ReactElement | null => {
  const dispatch = useAppDispatch();
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
    (question) =>
      question.programItemId === signup.programItemDetails.programItemId,
  );

  const removeSignup = async (): Promise<void> => {
    setLoading(true);
    const errorMessage = await dispatch(
      submitDeleteDirectSignup({
        username,
        startTime: signup.programItemDetails.startTime,
        directSignupProgramItemId: signup.programItemDetails.programItemId,
      }),
    );

    if (errorMessage) {
      setServerError(errorMessage);
    } else {
      await loadProgramItems();
      setCancelSignupFormOpen(false);
    }
    setLoading(false);
  };

  if (signup.programItemDetails.startTime !== startTime) {
    return null;
  }

  return (
    <ProgramItemDetailsList key={signup.programItemDetails.programItemId}>
      <GameTitleAndButtons>
        <div>
          <StyledLink
            to={`/program/${signup.programItemDetails.programItemId}`}
          >
            {signup.programItemDetails.title}
          </StyledLink>
          {config.shared().signupOpen && !cancelSignupFormOpen && (
            <IconButton
              onClick={() => setCancelSignupFormOpen(true)}
              icon="calendar-xmark"
              ariaLabel={t("button.cancelSignup")}
            />
          )}
        </div>
        {config.shared().signupOpen && cancelSignupFormOpen && (
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
      </GameTitleAndButtons>

      {signup.time !== signup.programItemDetails.startTime && (
        <div>
          {t("myProgramView.startingTimeChanged")}{" "}
          {getShortWeekdayAndTime(signup.time)}{" "}
          <FontAwesomeIcon icon="arrow-right" />{" "}
          {getShortWeekdayAndTime(signup.programItemDetails.startTime)}
        </div>
      )}

      {!!signupQuestion && (
        <SignupQuestionPlacement>
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
        </SignupQuestionPlacement>
      )}

      {serverError && (
        <ErrorMessage
          message={t(serverError)}
          closeError={() => setServerError(null)}
        />
      )}
    </ProgramItemDetailsList>
  );
};

const ProgramItemDetailsList = styled.li`
  display: flex;
  flex-direction: column;
`;

const GameTitleAndButtons = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;

const SignupQuestionPlacement = styled.div`
  padding-top: 5px;
`;

const CancelSignupFormContainer = styled.div`
  max-width: 240px;
`;

const StyledLink = styled(Link)`
  margin-right: 8px;
`;
