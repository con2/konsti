import React, { FC, ReactElement, FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { Button } from 'client/components/Button';
import { Game } from 'shared/typings/models/game';
import { submitDeleteGame } from 'client/views/signup/signupThunks';
import { useAppDispatch, useAppSelector } from 'client/utils/hooks';

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

  const removeSignup = async (): Promise<void> => {
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
    <span>
      <Button onClick={removeSignup}>{t('signup.confirmCancelSignup')}</Button>{' '}
      <Button onClick={handleCancel}>{t('signup.cancel')}</Button>
    </span>
  );
};
