import React, { FC, ReactElement, FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Game } from 'shared/typings/models/game';
import { submitEnterGame } from 'client/views/signup/signupThunks';
import { useAppDispatch, useAppSelector } from 'client/utils/hooks';

interface Props {
  game: Game;
}

export const EnterGameForm: FC<Props> = (props: Props): ReactElement => {
  const { game } = props;

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
    } catch (error) {
      switch (error.code) {
        case 41:
          console.error('Signup ended');
          return;
        default:
          console.error('signupError');
      }
    }
  };

  return (
    <form>
      <button onClick={handleSignup}>{t('signup.confirm')}</button>
    </form>
  );
};
