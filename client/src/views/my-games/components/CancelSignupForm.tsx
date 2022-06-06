import React, { FC, ReactElement } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { Button, ButtonStyle } from "client/components/Button";
import { Game } from "shared/typings/models/game";
import { submitDeleteEnteredGame } from "client/views/my-games/myGamesThunks";
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
      submitDeleteEnteredGame({
        username,
        startTime: game.startTime,
        enteredGameId: game.gameId,
      })
    );
    onCancelSignup();
  };

  return (
    <div>
      <Button onClick={removeSignup} buttonStyle={ButtonStyle.WARNING}>
        {t("signup.confirmCancelSignup")}
      </Button>{" "}
      <CancelFormButton onClick={handleCancel} buttonStyle={ButtonStyle.NORMAL}>
        {t("signup.cancel")}
      </CancelFormButton>
    </div>
  );
};

const CancelFormButton = styled(Button)`
  border: 1px solid ${(props) => props.theme.borderInformative};
`;
