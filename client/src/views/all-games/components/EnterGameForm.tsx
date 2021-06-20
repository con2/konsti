import React, { FC, ReactElement, FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Game } from 'shared/typings/models/game';
import { submitEnterGame } from 'client/views/signup/signupThunks';
import { useAppDispatch, useAppSelector } from 'client/utils/hooks';
import { Button } from 'client/components/Button';

interface Props {
  game: Game;
  onEnterGame: () => void;
}

export const EnterGameForm: FC<Props> = (props: Props): ReactElement => {
  const { game, onEnterGame } = props;

  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const username = useAppSelector((state) => state.login.username);

  const handleSignup = async (event: FormEvent): Promise<void> => {
    event.preventDefault();

    const newGame = {
      gameDetails: game,
      priority: 0,
      time: game.startTime,
    };

    const enterData = {
      username,
      enteredGameId: game.gameId,
      startTime: game.startTime,
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
    <form>
      <Button onClick={handleSignup}>{t('signup.confirm')}</Button>
    </form>
  );
};
