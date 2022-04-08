import React, { ReactElement, MouseEvent } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { updateUnsavedChangesStatus } from "client/views/signup/signupSlice";
import { SelectedGame } from "shared/typings/models/user";
import { useAppDispatch } from "client/utils/hooks";
import { AppDispatch } from "client/typings/redux.typings";
import { Button } from "client/components/Button";
import { SignupError } from "client/views/signup/components/SignupList";

interface Props {
  groupCode: string;
  isGroupLeader: boolean;
  onCancelClick: (event: MouseEvent) => void;
  onSubmitClick: (event: MouseEvent) => void;
  selectedGames: readonly SelectedGame[];
  signedGames: readonly SelectedGame[];
  signupError: SignupError;
  signupSubmitted: boolean;
  submitting: boolean;
}

export const SignupActionButtons = ({
  groupCode,
  isGroupLeader,
  onCancelClick,
  onSubmitClick,
  selectedGames,
  signedGames,
  signupError,
  signupSubmitted,
  submitting,
}: Props): ReactElement => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  return (
    <div>
      <Button disabled={submitting || !isGroupLeader} onClick={onSubmitClick}>
        {t("button.signup")}
      </Button>

      <Button disabled={submitting || !isGroupLeader} onClick={onCancelClick}>
        {t("button.cancelSignup")}
      </Button>

      {signupSubmitted && <SuccessMessage>{t("signupSaved")}</SuccessMessage>}

      {checkForSignupChanges(signedGames, selectedGames, dispatch) && (
        <InfoMessage>{t("signupUnsavedChanges")}</InfoMessage>
      )}

      {!isGroupLeader && <InfoText>{t("signupDisabledNotLeader")}</InfoText>}
      {isGroupLeader && groupCode !== "0" && (
        <InfoText>{t("signupForWholeGroup")}</InfoText>
      )}

      <p>{signupError && <ErrorMessage>{t(signupError)} </ErrorMessage>}</p>
    </div>
  );
};

const ErrorMessage = styled.span`
  color: ${(props) => props.theme.error};
`;

const InfoMessage = styled.span`
  color: ${(props) => props.theme.informative};
  font-weight: 600;
`;

const SuccessMessage = styled.span`
  color: ${(props) => props.theme.success};
  font-weight: 600;
`;

const checkForSignupChanges = (
  signedGames: readonly SelectedGame[],
  selectedGames: readonly SelectedGame[],
  dispatch: AppDispatch
): boolean => {
  const filteredSignedGames = signedGames.filter((signedGame) => {
    return selectedGames.find((selectedGame) => {
      return signedGame.gameDetails.gameId === selectedGame.gameDetails.gameId;
    });
  });

  const filteredSelectedGames = selectedGames.filter((selectedGame) => {
    return signedGames.find((signedGame) => {
      return selectedGame.gameDetails.gameId === signedGame.gameDetails.gameId;
    });
  });

  if (
    filteredSignedGames.length !== signedGames.length ||
    filteredSelectedGames.length !== selectedGames.length
  ) {
    dispatch(updateUnsavedChangesStatus(true));
    return true;
  } else {
    dispatch(updateUnsavedChangesStatus(false));
    return false;
  }
};

const InfoText = styled.p`
  font-weight: 600;
`;
