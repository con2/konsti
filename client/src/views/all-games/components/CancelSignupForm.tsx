import React, { FC, ReactElement, FormEvent } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { Game } from 'shared/typings/models/game';
import { useAppDispatch, useAppSelector } from 'client/utils/hooks';
import { Button } from 'client/components/Button';
import { submitDeleteGame } from 'client/views/signup/signupThunks';

interface Props {
  game: Game;
  onCancelSignup: () => void;
  onCancelForm: () => void;
}

export const CancelSignupForm: FC<Props> = (props: Props): ReactElement => {
  const { game, onCancelSignup, onCancelForm } = props;

  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const username = useAppSelector((state) => state.login.username);

  const handleCancel = (): void => {
    onCancelForm();
  };
  const removeSignup = async (event: FormEvent): Promise<void> => {
    await dispatch(
      submitDeleteGame({
        username,
        startTime: game.startTime,
        enteredGameId: game.gameId,
      })
    );
    onCancelSignup();
  };

  return (
    <CancelSignupFormContainer>
      <ButtonContainer>
        <Button onClick={removeSignup}>
          {t('signup.confirmCancelSignup')}
        </Button>
        <Button onClick={handleCancel}>{t('signup.cancel')}</Button>
      </ButtonContainer>
    </CancelSignupFormContainer>
  );
};

const CancelSignupFormContainer = styled.form`
  display: flex;
  flex-direction: column;
`;

const ButtonContainer = styled.div`
  display: flex;
  flex-direction: row;
`;
