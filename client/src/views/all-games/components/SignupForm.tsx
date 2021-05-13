import React, { FC, ReactElement, useRef, FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Game } from 'shared/typings/models/game';
import {
  submitSignup,
  submitSelectedGames,
} from 'client/views/signup/signupActions';
import { useAppDispatch, useAppSelector } from 'client/utils/hooks';

interface Props {
  game: Game;
  startTime: string;
}

export const SignupForm: FC<Props> = (props: Props): ReactElement => {
  const { game, startTime } = props;

  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const selectedGames = useAppSelector((state) => state.myGames.signedGames);
  const username = useAppSelector((state) => state.login.username);
  const priorityRef = useRef<HTMLSelectElement>(null);

  const handleSignup = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    if (!priorityRef.current) {
      return;
    }

    const newGame = [
      {
        gameDetails: game,
        priority: parseInt(priorityRef.current.value, 10),
        time: game.startTime,
      },
    ];

    const combined = selectedGames.concat(newGame);
    dispatch(submitSelectedGames(combined));

    const signupData = {
      username,
      selectedGames: combined,
      signupTime: game.startTime,
    };

    try {
      await dispatch(submitSignup(signupData));
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

  const selectedPriorities = selectedGames
    .filter((game) => game.gameDetails.startTime === startTime)
    .map((game) => game.priority);
  const isAlreadySelected = (priority: number): boolean =>
    selectedPriorities.includes(priority);

  return (
    <form>
      {t('signup.gamePriority')}{' '}
      <select ref={priorityRef}>
        <option disabled={isAlreadySelected(1)} value='1'>
          1
        </option>
        <option disabled={isAlreadySelected(2)} value='2'>
          2
        </option>
        <option disabled={isAlreadySelected(3)} value='3'>
          3
        </option>
      </select>
      <button onClick={handleSignup}>{t('signup.confirm')}</button>
    </form>
  );
};
