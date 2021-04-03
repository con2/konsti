import React, { FC, ReactElement, useRef, FormEvent } from 'react';
import { Game } from 'typings/game.typings';
import { Signup } from 'typings/user.typings';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from 'typings/redux.typings';
import { submitSignup, submitSelectedGames } from 'views/signup/signupActions';

interface Props {
  game: Game;
  startTime: string;
}

export const SignupForm: FC<Props> = (props: Props): ReactElement => {
  const { game, startTime } = props;

  const dispatch = useDispatch();
  const selectedGames: readonly Signup[] = useSelector(
    (state: RootState) => state.myGames.signedGames
  );
  const username: string = useSelector(
    (state: RootState) => state.login.username
  );
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
        case 40:
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
      Peli on toiveissani sijalla{' '}
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
      <button onClick={handleSignup}>Vahvista</button>
    </form>
  );
};
