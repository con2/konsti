import React, { FC, ReactElement, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Game } from 'shared/typings/models/game';
import { getUpcomingEnteredGames } from 'client/utils/getUpcomingGames';
import { EnterGameForm } from './EnterGameForm';
import { submitDeleteGame } from 'client/views/signup/signupThunks';
import { SelectedGame } from 'shared/typings/models/user';
import { useAppDispatch, useAppSelector } from 'client/utils/hooks';
import { isAlreadySigned } from './allGamesUtils';
import { Button } from 'client/components/Button';

interface Props {
  game: Game;
  startTime: string;
}

export const DirectSignupForm: FC<Props> = (
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
    await dispatch(
      submitDeleteGame({
        username,
        startTime: gameToRemove.startTime,
        enteredGameId: gameToRemove.gameId,
      })
    );
  };

  const enteredGamesForTimeslot = getUpcomingEnteredGames(enteredGames).filter(
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

  const signupForDirect = (
    alreadySigned: boolean,
    enteredGamesForTimeSlot: readonly SelectedGame[]
  ): JSX.Element | null => {
    if (alreadySigned) {
      return null;
    }

    if (enteredGamesForTimeSlot.length === 1) {
      return (
        <p>
          {t('signup.cannotSignupMoreThanOneGame', {
            GAME: enteredGamesForTimeslot[0].gameDetails.title,
          })}
        </p>
      );
    }

    if (enteredGamesForTimeSlot.length === 0) {
      return (
        <Button onClick={() => setSignupFormOpen(!signupFormOpen)}>
          {t('signup.signup')}
        </Button>
      );
    }

    return null;
  };

  if (loggedIn) {
    return (
      <>
        {signupForDirect(alreadySignedToGame, enteredGamesForTimeslot)}
        {alreadySignedToGame && (
          <Button onClick={async () => await removeSignup(game)}>
            {t('button.cancel')}
          </Button>
        )}
        {signupFormOpen && !alreadySignedToGame && (
          <EnterGameForm
            game={game}
            onEnterGame={() => setSignupFormOpen(false)}
          />
        )}
      </>
    );
  }

  return null;
};
