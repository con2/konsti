import React, { ReactElement, useRef, FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Game } from "shared/typings/models/game";
import { submitPostSignedGames } from "client/views/my-games/myGamesThunks";
import { useAppDispatch, useAppSelector } from "client/utils/hooks";
import { Button } from "client/components/Button";

interface Props {
  game: Game;
  startTime: string;
  onCancel: () => void;
}

export const SignupForm = ({
  game,
  startTime,
  onCancel,
}: Props): ReactElement => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const selectedGames = useAppSelector((state) => state.myGames.signedGames);
  const username = useAppSelector((state) => state.login.username);
  const priorityRef = useRef<HTMLSelectElement>(null);

  const handleCancel = (): void => {
    onCancel();
  };

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
        message: "",
      },
    ];

    const combined = selectedGames.concat(newGame);

    const signupData = {
      username,
      selectedGames: combined,
      signupTime: game.startTime,
    };

    const errorCode = await dispatch(submitPostSignedGames(signupData));

    if (errorCode) {
      switch (errorCode) {
        case 41:
          console.error("Signup ended"); // eslint-disable-line no-console
          return;
        default:
          console.error("signupError"); // eslint-disable-line no-console
      }
    }
  };

  const selectedPriorities = selectedGames
    .filter((selectedGame) => selectedGame.gameDetails.startTime === startTime)
    .map((selectedGame) => selectedGame.priority);

  const isAlreadySelected = (priority: number): boolean =>
    selectedPriorities.includes(priority);

  return (
    <form>
      {t("signup.gamePriority")}{" "}
      <select ref={priorityRef}>
        <option disabled={isAlreadySelected(1)} value="1">
          1
        </option>
        <option disabled={isAlreadySelected(2)} value="2">
          2
        </option>
        <option disabled={isAlreadySelected(3)} value="3">
          3
        </option>
      </select>
      <Button onClick={handleSignup}>{t("signup.confirm")}</Button>
      <Button onClick={handleCancel}>{t("signup.cancel")}</Button>
    </form>
  );
};
