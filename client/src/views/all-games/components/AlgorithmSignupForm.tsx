import React, { FC, ReactElement, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Game } from 'shared/typings/models/game';
import {
  getSignedGames,
  getUpcomingEnteredGames,
} from 'client/utils/getUpcomingGames';
import { SignupForm } from './SignupForm';
import { submitSignup } from 'client/views/signup/signupThunks';
import { SelectedGame } from 'shared/typings/models/user';
import { useAppDispatch, useAppSelector } from 'client/utils/hooks';
import { submitSelectedGames } from 'client/views/signup/signupSlice';
import { isAlreadySigned } from './allGamesUtils';

interface Props {
  game: Game;
  startTime: string;
}

export const AlgorithmSignupForm: FC<Props> = (
  props: Props
): ReactElement | null => {
  const { game, startTime } = props;

  const { t } = useTranslation();

  const username = useAppSelector((state) => state.login.username);
  const loggedIn = useAppSelector((state) => state.login.loggedIn);
  const serial = useAppSelector((state) => state.login.serial);
  const groupCode = useAppSelector((state) => state.login.groupCode);
  const signedGames = useAppSelector((state) => state.myGames.signedGames);
  const enteredGames = useAppSelector((state) => state.myGames.enteredGames);
  const groupMembers = useAppSelector((state) => state.login.groupMembers);
  const [signupFormOpen, setSignupFormOpen] = useState(false);

  const dispatch = useAppDispatch();

  const removeSignup = async (gameToRemove: Game): Promise<void> => {
    const allSignedGames = getSignedGames(
      signedGames,
      groupCode,
      serial,
      groupMembers,
      true
    );
    const allEnteredGames = getUpcomingEnteredGames(enteredGames);
    const newSignupData = [...allSignedGames, ...allEnteredGames].filter(
      (g: SelectedGame) => g.gameDetails.gameId !== gameToRemove.gameId
    );
    dispatch(submitSelectedGames(newSignupData));
    const signupData = {
      username,
      selectedGames: newSignupData,
      signupTime: gameToRemove.startTime,
    };

    await dispatch(submitSignup(signupData));
  };

  const currentPriority = signedGames.find(
    (g) => g.gameDetails.gameId === game.gameId
  )?.priority;

  const signedGamesForTimeslot = signedGames.filter(
    (g) => g.gameDetails.startTime === startTime
  );

  const alreadySignedToGame = isAlreadySigned(
    game,
    signedGames,
    groupCode,
    serial,
    groupMembers,
    enteredGames
  );

  const signupForAlgorithm = (
    alreadySigned: boolean,
    signedGamesForTimeSlot: readonly SelectedGame[]
  ): JSX.Element | null => {
    if (alreadySigned) {
      return null;
    }

    if (signedGamesForTimeSlot.length >= 3) {
      return <p>{t('signup.cannotSignupMoreGames')}</p>;
    }

    if (signedGamesForTimeSlot.length < 3) {
      return (
        <button onClick={() => setSignupFormOpen(!signupFormOpen)}>
          {t('signup.signup')}
        </button>
      );
    }

    return null;
  };

  if (loggedIn) {
    return (
      <>
        {signupForAlgorithm(alreadySignedToGame, signedGamesForTimeslot)}
        {alreadySignedToGame && (
          <>
            <button onClick={async () => await removeSignup(game)}>
              {t('button.cancel')}
            </button>
            <p>
              {t('signup.alreadySigned', {
                CURRENT_PRIORITY: currentPriority,
              })}
            </p>
          </>
        )}
        {signupFormOpen && !alreadySignedToGame && (
          <SignupForm game={game} startTime={startTime} />
        )}
      </>
    );
  }

  return null;
};
