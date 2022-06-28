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
  const signupMessages = useAppSelector((state) => state.admin.signupMessages);

  const [cancelSignupFormOpen, setCancelSignupFormOpen] = useState(false);
  const [serverError, setServerError] =
    useState<DeleteEnteredGameErrorMessage | null>(null);

  const signupMessage = signupMessages.find(
    (message) => message.gameId === signup.gameDetails.gameId
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
      <Link to={`/games/${signup.gameDetails.gameId}`}>
        {signup.gameDetails.title}
      </Link>

      <ButtonContainer>
        {cancelSignupFormOpen ? (
          <CancelSignupForm
            onCancelForm={() => {
              setServerError(null);
              setCancelSignupFormOpen(false);
            }}
            onConfirmForm={async () => await removeSignup()}
          />
        ) : (
          <Button
            onClick={() => setCancelSignupFormOpen(true)}
            buttonStyle={ButtonStyle.NORMAL}
          >
            {t("button.cancelSignup")}
          </Button>
        )}
      </ButtonContainer>

      {!!signupMessage && (
        <SignupMessagePlacement>
          <FontAwesomeIcon icon={"comment"} />
          {` ${t("myGamesView.yourAnswer")} "${signupMessage.message}": ${
            signup.message
          }`}
        </SignupMessagePlacement>
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
  align-items: center;
  padding-left: 30px;
`;

const ButtonContainer = styled.div`
  padding-left: 10px;
`;

const SignupMessagePlacement = styled.div`
  padding-top: 5px;
`;
