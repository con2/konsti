import { ReactElement, useState } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { SelectedGame } from "shared/typings/models/user";
import { useAppDispatch, useAppSelector } from "client/utils/hooks";
import {
  DeleteEnteredGameErrorMessage,
  submitDeleteEnteredGame,
} from "client/views/my-games/myGamesThunks";
import { CancelSignupForm } from "client/views/all-games/components/CancelSignupForm";
import { ErrorMessage } from "client/components/ErrorMessage";
import { loadGames } from "client/utils/loadData";
import { getSharedConfig } from "shared/config/sharedConfig";
import { IconButton } from "client/components/IconButton";

interface Props {
  signup: SelectedGame;
  startTime: string;
}

export const EnteredGameRow = ({
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
    useState<DeleteEnteredGameErrorMessage | null>(null);

  const signupQuestion = signupQuestions.find(
    (question) => question.gameId === signup.gameDetails.gameId,
  );

  const removeSignup = async (): Promise<void> => {
    setLoading(true);
    const errorMessage = await dispatch(
      submitDeleteEnteredGame({
        username,
        startTime: signup.gameDetails.startTime,
        enteredGameId: signup.gameDetails.gameId,
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

  if (signup.time !== startTime) {
    return null;
  }

  return (
    <GameDetailsList key={signup.gameDetails.gameId}>
      <GameTitleAndButtons>
        <div>
          <StyledLink to={`/games/${signup.gameDetails.gameId}`}>
            {signup.gameDetails.title}
          </StyledLink>
          {getSharedConfig().signupOpen && !cancelSignupFormOpen && (
            <IconButton
              onClick={() => setCancelSignupFormOpen(true)}
              icon="calendar-xmark"
              ariaLabel={t("button.cancelSignup")}
            />
          )}
        </div>
        {getSharedConfig().signupOpen && cancelSignupFormOpen && (
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
