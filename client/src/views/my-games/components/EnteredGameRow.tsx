import React, { ReactElement, useState } from "react";
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
import { Button, ButtonStyle } from "client/components/Button";
import { ErrorMessage } from "client/components/ErrorMessage";
import { loadGames } from "client/utils/loadData";

interface Props {
  signup: SelectedGame;
  startTime: string;
}

export const EnteredGameRow = ({
  signup,
  startTime,
}: Props): ReactElement | null => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const username = useAppSelector((state) => state.login.username);
  const signupQuestions = useAppSelector(
    (state) => state.admin.signupQuestions
  );

  const [cancelSignupFormOpen, setCancelSignupFormOpen] = useState(false);
  const [serverError, setServerError] =
    useState<DeleteEnteredGameErrorMessage | null>(null);

  const signupQuestion = signupQuestions.find(
    (question) => question.gameId === signup.gameDetails.gameId
  );

  const removeSignup = async (): Promise<void> => {
    const errorMessage = await dispatch(
      submitDeleteEnteredGame({
        username,
        startTime: signup.gameDetails.startTime,
        enteredGameId: signup.gameDetails.gameId,
      })
    );

    if (errorMessage) {
      setServerError(errorMessage);
    } else {
      await loadGames();
      setCancelSignupFormOpen(false);
    }
  };

  if (signup.time !== startTime) {
    return null;
  }

  return (
    <GameDetailsList key={signup.gameDetails.gameId}>
      <div>
        <Link to={`/games/${signup.gameDetails.gameId}`}>
          {signup.gameDetails.title}
        </Link>
      </div>
      <ButtonContainer>
        {cancelSignupFormOpen ? (
          <CancelSignupFormContainer>
            <CancelSignupForm
              onCancelForm={() => {
                setServerError(null);
                setCancelSignupFormOpen(false);
              }}
              onConfirmForm={async () => await removeSignup()}
            />
          </CancelSignupFormContainer>
        ) : (
          <Button
            onClick={() => setCancelSignupFormOpen(true)}
            buttonStyle={ButtonStyle.NORMAL}
          >
            {t("button.cancelSignup")}
          </Button>
        )}
      </ButtonContainer>

      {!!signupQuestion && (
        <SignupQuestionPlacement>
          <FontAwesomeIcon icon={["far", "comment"]} />
          {` ${t("myGamesView.yourAnswer")} "${signupQuestion.message}"${
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

const GameDetailsList = styled.div`
  display: flex;
  flex-direction: column;
  padding-left: 10px;
`;

const ButtonContainer = styled.div`
  padding-left: 10px;
`;

const SignupQuestionPlacement = styled.div`
  padding-top: 5px;
`;

const CancelSignupFormContainer = styled.div`
  max-width: 240px;
`;
