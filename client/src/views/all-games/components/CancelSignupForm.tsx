import React, { FC, ReactElement, FormEvent, useState } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { Game } from "shared/typings/models/game";
import { useAppDispatch, useAppSelector } from "client/utils/hooks";
import { Button, ButtonStyle } from "client/components/Button";
import {
  DeleteEnteredGameErrorMessage,
  submitDeleteEnteredGame,
} from "client/views/my-games/myGamesThunks";
import { loadGames } from "client/utils/loadData";
import { ErrorMessage } from "client/components/ErrorMessage";

interface Props {
  game: Game;
  onCancelSignup: () => void;
  onCancelForm: () => void;
}

export const CancelSignupForm: FC<Props> = (props: Props): ReactElement => {
  const { game, onCancelSignup, onCancelForm } = props;

  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const username = useAppSelector((state) => state.login.username);

  const [serverError, setServerError] =
    useState<DeleteEnteredGameErrorMessage | null>(null);

  const handleCancel = (): void => {
    onCancelForm();
  };
  const removeSignup = async (event: FormEvent): Promise<void> => {
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
      onCancelSignup();
    }
  };

  return (
    <>
      <ButtonContainer>
        <CancelSignupButton
          onClick={removeSignup}
          buttonStyle={ButtonStyle.WARNING}
        >
          {t("signup.confirmCancelSignup")}
        </CancelSignupButton>
        <CancelFormButton
          onClick={handleCancel}
          buttonStyle={ButtonStyle.NORMAL}
        >
          {t("signup.cancel")}
        </CancelFormButton>
      </ButtonContainer>

      {serverError && (
        <ErrorMessage
          message={t(serverError)}
          closeError={() => setServerError(null)}
        />
      )}
    </>
  );
};

const ButtonContainer = styled.div`
  display: flex;
  flex-direction: row;
`;

const CancelSignupButton = styled(Button)`
  width: 50%;
`;

const CancelFormButton = styled(Button)`
  border: 1px solid ${(props) => props.theme.borderInformative};
  width: 50%;
`;
