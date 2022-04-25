import React, { FC, ReactElement, useState } from "react";
import { useTranslation } from "react-i18next";
import { Game } from "shared/typings/models/game";
import { getUpcomingEnteredGames } from "client/utils/getUpcomingGames";
import { SignupForm } from "./SignupForm";
import { submitSignup } from "client/views/signup/signupThunks";
import { SelectedGame } from "shared/typings/models/user";
import { useAppDispatch, useAppSelector } from "client/utils/hooks";
import { submitSelectedGames } from "client/views/signup/signupSlice";
import { isAlreadySigned } from "./allGamesUtils";
import { Button } from "client/components/Button";
import { getIsGroupCreator } from "client/views/group/utils/getIsGroupCreator";

interface Props {
  game: Game;
  startTime: string;
  signedGames: readonly SelectedGame[];
}

export const AlgorithmSignupForm: FC<Props> = ({
  game,
  startTime,
  signedGames,
}: Props): ReactElement | null => {
  const { t } = useTranslation();

  const username = useAppSelector((state) => state.login.username);
  const loggedIn = useAppSelector((state) => state.login.loggedIn);
  const enteredGames = useAppSelector((state) => state.myGames.enteredGames);
  const serial = useAppSelector((state) => state.login.serial);
  const groupCode = useAppSelector((state) => state.group.groupCode);
  const isGroupCreator = getIsGroupCreator(groupCode, serial);

  const [signupFormOpen, setSignupFormOpen] = useState(false);

  const dispatch = useAppDispatch();

  const removeSignup = async (gameToRemove: Game): Promise<void> => {
    const allEnteredGames = getUpcomingEnteredGames(enteredGames);
    const newSignupData = [...signedGames, ...allEnteredGames].filter(
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

  const alreadySignedToGame = isAlreadySigned(game, signedGames);

  const signupForAlgorithm = (
    alreadySigned: boolean,
    signedGamesForTimeSlot: readonly SelectedGame[]
  ): JSX.Element | null => {
    if (alreadySigned) {
      return null;
    }

    if (!isGroupCreator) {
      return null;
    }

    if (signedGamesForTimeSlot.length >= 3) {
      return <p>{t("signup.cannotSignupMoreGames")}</p>;
    }

    if (signedGamesForTimeSlot.length < 3 && !signupFormOpen) {
      return (
        <Button onClick={() => setSignupFormOpen(!signupFormOpen)}>
          {t("signup.signup")}
        </Button>
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
            {isGroupCreator && (
              <Button onClick={async () => await removeSignup(game)}>
                {t("button.cancel")}
              </Button>
            )}
            <p>
              {t("signup.alreadySigned", {
                CURRENT_PRIORITY: currentPriority,
              })}
            </p>
          </>
        )}
        {signupFormOpen && !alreadySignedToGame && (
          <SignupForm
            game={game}
            startTime={startTime}
            onCancel={() => setSignupFormOpen(false)}
          />
        )}
      </>
    );
  }

  return null;
};
