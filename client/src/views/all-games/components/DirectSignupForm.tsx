import React, { FC, ReactElement, useState } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { Game } from "shared/typings/models/game";
import { EnterGameForm } from "./EnterGameForm";
import { SelectedGame } from "shared/typings/models/user";
import { useAppDispatch, useAppSelector } from "client/utils/hooks";
import { isAlreadyEntered } from "./allGamesUtils";
import { Button, ButtonStyle } from "client/components/Button";
import { CancelSignupForm } from "./CancelSignupForm";
import { PhaseGap } from "shared/utils/getPhaseGap";
import { timeFormatter } from "client/utils/timeFormatter";
import {
  DeleteEnteredGameErrorMessage,
  submitDeleteEnteredGame,
} from "client/views/my-games/myGamesThunks";
import { loadGames } from "client/utils/loadData";
import { ErrorMessage } from "client/components/ErrorMessage";
import { selectActiveEnteredGames } from "client/views/my-games/myGamesSlice";

interface Props {
  game: Game;
  startTime: string;
  gameIsFull: boolean;
  phaseGap: PhaseGap;
}

export const DirectSignupForm: FC<Props> = ({
  game,
  startTime,
  gameIsFull,
  phaseGap,
}: Props): ReactElement | null => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const loggedIn = useAppSelector((state) => state.login.loggedIn);
  const username = useAppSelector((state) => state.login.username);
  const activeEnteredGames = useAppSelector(selectActiveEnteredGames);
  const signupQuestions = useAppSelector(
    (state) => state.admin.signupQuestions
  );

  const [signupFormOpen, setSignupFormOpen] = useState(false);
  const [cancelSignupFormOpen, setCancelSignupFormOpen] = useState(false);
  const [serverError, setServerError] =
    useState<DeleteEnteredGameErrorMessage | null>(null);

  const enteredGamesForTimeslot = activeEnteredGames.filter(
    (g) => g.gameDetails.startTime === startTime
  );

  const alreadyEnteredToGame = isAlreadyEntered(game, activeEnteredGames);

  const removeSignup = async (): Promise<void> => {
    const errorMessage = await dispatch(
      submitDeleteEnteredGame({
        username,
        startTime: game.startTime,
        enteredGameId: game.gameId,
      })
    );

    if (errorMessage) {
      setServerError(errorMessage);
    } else {
      await loadGames();
      setCancelSignupFormOpen(false);
    }
  };

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

    if (phaseGap.waitingForPhaseGapToEnd) {
      return (
        <p>
          {t("signup.signupOpens")}{" "}
          {timeFormatter.getTime(phaseGap.phaseGapEndTime)}
        </p>
      );
    }

    if (enteredGamesForTimeSlot.length === 0 && !signupFormOpen) {
      return (
        <Button
          onClick={() => setSignupFormOpen(!signupFormOpen)}
          buttonStyle={ButtonStyle.NORMAL}
        >
          {t("signup.directSignup")}
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
          onClick={() => setCancelSignupFormOpen(true)}
          buttonStyle={ButtonStyle.NORMAL}
        >
          {t("button.cancelSignup")}
        </Button>
      )}
      {alreadyEnteredToGame && cancelSignupFormOpen && (
        <CancelSignupForm
          onCancelForm={() => {
            setCancelSignupFormOpen(false);
          }}
          onConfirmForm={async () => await removeSignup()}
        />
      )}
      {signupFormOpen && !alreadyEnteredToGame && !gameIsFull && (
        <EnterGameForm
          game={game}
          signupQuestion={signupQuestions.find(
            ({ gameId }) => gameId === game.gameId
          )}
          onEnterGame={() => setSignupFormOpen(false)}
          onCancelSignup={() => setSignupFormOpen(false)}
        />
      )}

      {serverError && (
        <ErrorMessage
          message={t(serverError)}
          closeError={() => setServerError(null)}
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
