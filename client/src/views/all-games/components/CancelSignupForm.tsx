import React, { FC, ReactElement, FormEvent } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { Game } from "shared/typings/models/game";
import { useAppDispatch, useAppSelector } from "client/utils/hooks";
import { Button } from "client/components/Button";
import { submitDeleteGame } from "client/views/my-games/myGamesThunks";
import { loadGames } from "client/utils/loadData";

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
  const removeSignup = async (event: FormEvent): Promise<void> => {
    await dispatch(
      submitDeleteGame({
        username,
        startTime: game.startTime,
        enteredGameId: game.gameId,
      })
    );
    await loadGames();
    onCancelSignup();
  };

  return (
    <ButtonContainer>
      <CancelSignupButton onClick={removeSignup}>
        {t("signup.confirmCancelSignup")}
      </CancelSignupButton>
      <CancelFormButton onClick={handleCancel}>
        {t("signup.cancel")}
      </CancelFormButton>
    </ButtonContainer>
  );
};

const ButtonContainer = styled.div`
  display: flex;
  flex-direction: row;
`;

const CancelSignupButton = styled(Button)`
  width: 50%;
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
  width: 50%;
  border: 1px solid ${(props) => props.theme.informative};
`;
