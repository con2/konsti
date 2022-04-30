import React, { FC, ReactElement, useState } from "react";
import { useTranslation } from "react-i18next";
import { Game } from "shared/typings/models/game";
import { SignupForm } from "./SignupForm";
import { submitPostSignedGames } from "client/views/my-games/myGamesThunks";
import { SelectedGame } from "shared/typings/models/user";
import { useAppDispatch, useAppSelector } from "client/utils/hooks";
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
  const serial = useAppSelector((state) => state.login.serial);
  const groupCode = useAppSelector((state) => state.group.groupCode);
  const isGroupCreator = getIsGroupCreator(groupCode, serial);

  const [signupFormOpen, setSignupFormOpen] = useState(false);

  const dispatch = useAppDispatch();

  const removeSignedGame = async (gameToRemove: Game): Promise<void> => {
    const newSignupData = signedGames.filter(
      (g: SelectedGame) => g.gameDetails.gameId !== gameToRemove.gameId
    );
    const signupData = {
      username,
      selectedGames: newSignupData,
      signupTime: gameToRemove.startTime,
    };

    await dispatch(submitPostSignedGames(signupData));
    setSignupFormOpen(false);
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
              <Button onClick={async () => await removeSignedGame(game)}>
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
