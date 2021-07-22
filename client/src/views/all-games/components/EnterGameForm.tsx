import React, { FC, ReactElement, FormEvent, useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { Game } from 'shared/typings/models/game';
import { submitEnterGame } from 'client/views/signup/signupThunks';
import { useAppDispatch, useAppSelector } from 'client/utils/hooks';
import { Button } from 'client/components/Button';
import { SignupMessage } from 'shared/typings/models/settings';

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
  const [userSignupMessage, setUserSignupMessage] = useState<string>('');

  const handleCancel = (): void => {
    onCancelSignup();
  };

  const handleSignup = async (event: FormEvent): Promise<void> => {
    event.preventDefault();

    const newGame = {
      gameDetails: game,
      priority: 0,
      time: game.startTime,
      message: '',
    };

    const enterData = {
      username,
      enteredGameId: game.gameId,
      startTime: game.startTime,
      message: userSignupMessage,
    };

    try {
      await dispatch(submitEnterGame(enterData, newGame));
      onEnterGame();
    } catch (error) {
      switch (error.code) {
        case 41:
          console.error('Signup ended'); // eslint-disable-line no-console
          return;
        default:
          console.error('signupError'); // eslint-disable-line no-console
      }
    }
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
        <SignupConfirmationButton onClick={handleSignup}>
          {t('signup.confirm')}
        </SignupConfirmationButton>
        <SignupCancelButton onClick={handleCancel}>
          {t('signup.cancel')}
        </SignupCancelButton>
      </ButtonContainer>
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
  border: 1px solid ${(props) => props.theme.buttonConfirmBorder};
  color: ${(props) => props.theme.mainText};
`;

const SignupCancelButton = styled(Button)`
  width: 50%;
  border: 1px solid ${(props) => props.theme.informative};
`;
