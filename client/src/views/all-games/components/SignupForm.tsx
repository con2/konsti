import React, { ReactElement, useRef, FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { Game } from "shared/typings/models/game";
import {
  PostSignedGamesErrorMessage,
  submitPostSignedGames,
} from "client/views/my-games/myGamesThunks";
import { useAppDispatch, useAppSelector } from "client/utils/hooks";
import { Button, ButtonStyle } from "client/components/Button";
import { ErrorMessage } from "client/components/ErrorMessage";

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
  // We need all signed games here
  const signedGames = useAppSelector((state) => state.myGames.signedGames);
  const username = useAppSelector((state) => state.login.username);
  const priorityRef = useRef<HTMLSelectElement>(null);
  const [errorMessage, setErrorMessage] =
    useState<PostSignedGamesErrorMessage | null>(null);

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

    const error = await dispatch(
      submitPostSignedGames({
        username,
        selectedGames: signedGames.concat(newGame),
        startTime: game.startTime,
      })
    );

    if (error) {
      setErrorMessage(error);
    } else {
      setErrorMessage(null);
    }
  };

  const selectedPriorities = signedGames
    .filter((signedGame) => signedGame.gameDetails.startTime === startTime)
    .map((signedGame) => signedGame.priority);

  const isAlreadySelected = (priority: number): boolean =>
    selectedPriorities.includes(priority);

  return (
    <form>
      {t("signup.gamePriority")}{" "}
      <StyledSelect ref={priorityRef}>
        <StyledOption disabled={isAlreadySelected(1)} value="1">
          1
        </StyledOption>
        <StyledOption disabled={isAlreadySelected(2)} value="2">
          2
        </StyledOption>
        <StyledOption disabled={isAlreadySelected(3)} value="3">
          3
        </StyledOption>
      </StyledSelect>
      <Button onClick={handleSignup} buttonStyle={ButtonStyle.NORMAL}>
        {t("signup.confirm")}
      </Button>
      <Button onClick={handleCancel} buttonStyle={ButtonStyle.NORMAL}>
        {t("signup.cancel")}
      </Button>
      {errorMessage && (
        <ErrorMessage
          message={t(errorMessage)}
          closeError={() => setErrorMessage(null)}
        />
      )}
    </form>
  );
};

const StyledSelect = styled.select`
  margin-right: 10px;
`;

const StyledOption = styled.option<{ disabled: boolean }>`
  background-color: ${(props) =>
    props.disabled
      ? props.theme.backgroundDisabled
      : props.theme.backgroundMain};
`;
