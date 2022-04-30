import React, { FC, ReactElement } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { Button } from "client/components/Button";
import { Game } from "shared/typings/models/game";
import { submitDeleteGame } from "client/views/my-games/myGamesThunks";
import { useAppDispatch, useAppSelector } from "client/utils/hooks";

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

  const handleCancel = (): void => {
    onCancelForm();
  };

  const removeSignup = async (): Promise<void> => {
    await dispatch(
      submitDeleteGame({
        username,
        startTime: game.startTime,
        enteredGameId: game.gameId,
      })
    );
    onCancelSignup();
  };

  return (
    <div>
      <CancelSignupButton onClick={removeSignup}>
        {t("signup.confirmCancelSignup")}
      </CancelSignupButton>{" "}
      <CancelFormButton onClick={handleCancel}>
        {t("signup.cancel")}
      </CancelFormButton>
    </div>
  );
};

const CancelSignupButton = styled(Button)`
  background: ${(props) => props.theme.buttonCancelSignup};
  border: 1px solid ${(props) => props.theme.buttonCancelSignupBorder};
  color: ${(props) => props.theme.mainText};
  &:hover,
  &:focus {
    border: 1px solid ${(props) => props.theme.buttonCancelSignupBorder};
    background: ${(props) => props.theme.buttonCancelSignupHover};
    color: ${(props) => props.theme.mainText};
  }
`;

const CancelFormButton = styled(Button)`
  border: 1px solid ${(props) => props.theme.informative};
`;
