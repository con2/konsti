import React, { FC, ReactElement, FormEvent, useState } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { Game } from "shared/typings/models/game";
import {
  PostEnteredGameErrorMessage,
  submitPostEnteredGame,
} from "client/views/my-games/myGamesThunks";
import { useAppDispatch, useAppSelector } from "client/utils/hooks";
import { Button, ButtonStyle } from "client/components/Button";
import { SignupMessage } from "shared/typings/models/settings";
import { loadGames } from "client/utils/loadData";
import { ErrorMessage } from "client/components/ErrorMessage";

interface Props {
  game: Game;
  signupMessage: SignupMessage | undefined;
  onEnterGame: () => void;
  onCancelSignup: () => void;
}

export const EnterGameForm: FC<Props> = (props: Props): ReactElement => {
  const { game, onEnterGame, onCancelSignup, signupMessage } = props;
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const username = useAppSelector((state) => state.login.username);
  const [userSignupMessage, setUserSignupMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] =
    useState<PostEnteredGameErrorMessage | null>(null);

  const handleCancel = (): void => {
    onCancelSignup();
  };

  const handleSignup = async (event: FormEvent): Promise<void> => {
    event.preventDefault();

    const enterData = {
      username,
      enteredGameId: game.gameId,
      startTime: game.startTime,
      message: userSignupMessage,
    };

    const error = await dispatch(submitPostEnteredGame(enterData));
    if (error) {
      setErrorMessage(error);
      return;
    }

    await loadGames();
    onEnterGame();
  };

  return (
    <SignupForm>
      {signupMessage && (
        <SignupMessageContainer>
          <span>{signupMessage.message}</span>
          <textarea
            onChange={(evt) => {
              if (evt.target.value.length > 140) {
                return;
              }

              setUserSignupMessage(evt.target.value);
            }}
            value={userSignupMessage}
          />
          <span>{userSignupMessage.length} / 140</span>
        </SignupMessageContainer>
      )}
      <ButtonContainer>
        <SignupConfirmationButton
          onClick={handleSignup}
          buttonStyle={ButtonStyle.NORMAL}
        >
          {t("signup.confirm")}
        </SignupConfirmationButton>
        <SignupCancelButton
          onClick={handleCancel}
          buttonStyle={ButtonStyle.NORMAL}
        >
          {t("signup.cancel")}
        </SignupCancelButton>
      </ButtonContainer>
      {errorMessage && (
        <ErrorMessage
          message={t(errorMessage)}
          closeError={() => setErrorMessage(null)}
        />
      )}
    </SignupForm>
  );
};

const SignupForm = styled.form`
  display: flex;
  flex-direction: column;
`;

const SignupMessageContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

const ButtonContainer = styled.div`
  display: flex;
  flex-direction: row;
`;

const SignupConfirmationButton = styled(Button)`
  width: 50%;
  background: ${(props) => props.theme.buttonConfirm};
  border: 1px solid ${(props) => props.theme.buttonBorderConfirm};
  color: ${(props) => props.theme.textMain};
`;

const SignupCancelButton = styled(Button)`
  width: 50%;
  border: 1px solid ${(props) => props.theme.borderInformative};
`;
