import React, { FC, ReactElement, useState } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { Game } from "shared/typings/models/game";
import { EnterGameForm } from "./EnterGameForm";
import { SelectedGame } from "shared/typings/models/user";
import { useAppSelector } from "client/utils/hooks";
import { isAlreadyEntered } from "./allGamesUtils";
import { Button, ButtonStyle } from "client/components/Button";
import { CancelSignupForm } from "./CancelSignupForm";

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

  const loggedIn = useAppSelector((state) => state.login.loggedIn);
  const enteredGames = useAppSelector((state) => state.myGames.enteredGames);
  const [signupFormOpen, setSignupFormOpen] = useState(false);
  const [cancelSignupFormOpen, setCancelSignupFormOpen] = useState(false);
  const AdditionalInfoMessages = useAppSelector(
    (state) => state.admin.signupMessages
  );

  const enteredGamesForTimeslot = enteredGames.filter(
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
          {t("signup.alreadySignedToGame")}{" "}
          <SignedGameName>
            {enteredGamesForTimeslot[0].gameDetails.title}
          </SignedGameName>
          . {t("signup.cannotSignupMoreThanOneGame")}
        </p>
      );
    }

    if (enteredGamesForTimeSlot.length === 0 && !signupFormOpen) {
      return (
        <Button
          onClick={() => setSignupFormOpen(!signupFormOpen)}
          buttonStyle={ButtonStyle.NORMAL}
        >
          {t("signup.signup")}
        </Button>
      );
    }

    return null;
  };

  if (!loggedIn) {
    return null;
  }

  return (
    <>
      {signupForDirect(
        alreadyEnteredToGame,
        enteredGamesForTimeslot,
        gameIsFull
      )}
      {gameIsFull && <GameIsFull>{t("signup.gameIsFull")}</GameIsFull>}
      {alreadyEnteredToGame && !cancelSignupFormOpen && (
        <Button
          onClick={() => setCancelSignupFormOpen(!cancelSignupFormOpen)}
          buttonStyle={ButtonStyle.NORMAL}
        >
          {t("button.cancelSignup")}
        </Button>
      )}
      {alreadyEnteredToGame && cancelSignupFormOpen && (
        <CancelSignupForm
          game={game}
          onCancelSignup={() => {
            setCancelSignupFormOpen(false);
          }}
          onCancelForm={() => {
            setCancelSignupFormOpen(false);
          }}
        />
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
};

const GameIsFull = styled.h4`
  color: ${(props) => props.theme.textError};
`;

const SignedGameName = styled.span`
  font-weight: 600;
`;
