import React, { FC, ReactElement, useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { Game } from 'shared/typings/models/game';
import { getUpcomingEnteredGames } from 'client/utils/getUpcomingGames';
import { EnterGameForm } from './EnterGameForm';
import { submitDeleteGame } from 'client/views/signup/signupThunks';
import { SelectedGame } from 'shared/typings/models/user';
import { useAppDispatch, useAppSelector } from 'client/utils/hooks';
import { isAlreadyEntered } from './allGamesUtils';
import { Button } from 'client/components/Button';
import { loadGames } from 'client/utils/loadData';

interface Props {
  game: Game;
  startTime: string;
  gameIsFull: boolean;
}

export const DirectSignupForm: FC<Props> = (
  props: Props
): ReactElement | null => {
  const { game, startTime, gameIsFull } = props;

  const { t } = useTranslation();

  const username = useAppSelector((state) => state.login.username);
  const loggedIn = useAppSelector((state) => state.login.loggedIn);
  const enteredGames = useAppSelector((state) => state.myGames.enteredGames);
  const [signupFormOpen, setSignupFormOpen] = useState(false);
  const AdditionalInfoMessages = useAppSelector(
    (state) => state.admin.signupMessages
  );

  const dispatch = useAppDispatch();

  const removeSignup = async (gameToRemove: Game): Promise<void> => {
    await dispatch(
      submitDeleteGame({
        username,
        startTime: gameToRemove.startTime,
        enteredGameId: gameToRemove.gameId,
      })
    );
    await loadGames();
  };

  const enteredGamesForTimeslot = getUpcomingEnteredGames(enteredGames).filter(
    (g) => g.gameDetails.startTime === startTime
  );

  const alreadyEnteredToGame = isAlreadyEntered(game, enteredGames);

  const signupForDirect = (
    alreadySigned: boolean,
    enteredGamesForTimeSlot: readonly SelectedGame[],
    isFull: boolean
  ): JSX.Element | null => {
    if (alreadySigned || isFull) {
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

    if (enteredGamesForTimeSlot.length === 0 && !signupFormOpen) {
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
        {signupForDirect(
          alreadyEnteredToGame,
          enteredGamesForTimeslot,
          gameIsFull
        )}
        {gameIsFull && <GameIsFull>{t('signup.gameIsFull')}</GameIsFull>}
        {alreadyEnteredToGame && (
          <Button onClick={async () => await removeSignup(game)}>
            {t('button.cancel')}
          </Button>
        )}
        {signupFormOpen && !alreadyEnteredToGame && !gameIsFull && (
          <EnterGameForm
            game={game}
            signupMessage={AdditionalInfoMessages.find(
              ({ gameId }) => gameId === game.gameId
            )}
            onEnterGame={() => setSignupFormOpen(false)}
            onCancelSignup={() => setSignupFormOpen(false)}
          />
        )}
      </>
    );
  }

  return null;
};

const GameIsFull = styled.h4`
  color: ${(props) => props.theme.error};
`;
