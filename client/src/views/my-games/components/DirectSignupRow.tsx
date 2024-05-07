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
} from "client/views/my-games/myGamesThunks";
import { CancelSignupForm } from "client/views/all-games/components/CancelSignupForm";
import { ErrorMessage } from "client/components/ErrorMessage";
import { loadGames } from "client/utils/loadData";
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
    (question) => question.gameId === signup.gameDetails.gameId,
  );

  const removeSignup = async (): Promise<void> => {
    setLoading(true);
    const errorMessage = await dispatch(
      submitDeleteDirectSignup({
        username,
        startTime: signup.gameDetails.startTime,
        directSignupGameId: signup.gameDetails.gameId,
      }),
    );

    if (errorMessage) {
      setServerError(errorMessage);
    } else {
      await loadGames();
      setCancelSignupFormOpen(false);
    }
    setLoading(false);
  };

  if (signup.gameDetails.startTime !== startTime) {
    return null;
  }

  return (
    <GameDetailsList key={signup.gameDetails.gameId}>
      <GameTitleAndButtons>
        <div>
          <StyledLink to={`/games/${signup.gameDetails.gameId}`}>
            {signup.gameDetails.title}
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

      {signup.time !== signup.gameDetails.startTime && (
        <div>
          {t("myProgramView.startingTimeChanged")}{" "}
          {getShortWeekdayAndTime(signup.time)}{" "}
          <FontAwesomeIcon icon="arrow-right" />{" "}
          {getShortWeekdayAndTime(signup.gameDetails.startTime)}
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
    </GameDetailsList>
  );
};

const GameDetailsList = styled.li`
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
