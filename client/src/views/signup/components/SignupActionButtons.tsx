import React, { ReactElement, MouseEvent } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { updateUnsavedChangesStatus } from 'client/views/signup/signupSlice';
import { SelectedGame } from 'shared/typings/models/user';
import { useAppDispatch } from 'client/utils/hooks';
import { AppDispatch } from 'client/typings/redux.typings';
import { Button } from 'client/components/Button';

interface Props {
  groupCode: string;
  leader: boolean;
  onCancelClick: (event: MouseEvent) => void;
  onSubmitClick: (event: MouseEvent) => void;
  selectedGames: readonly SelectedGame[];
  signedGames: readonly SelectedGame[];
  signupError: string;
  signupSubmitted: boolean;
  submitting: boolean;
}

export const SignupActionButtons = ({
  groupCode,
  leader,
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
    <div className='signup-action-buttons-row'>
      <Button disabled={submitting || !leader} onClick={onSubmitClick}>
        {t('button.signup')}
      </Button>

      <Button disabled={submitting || !leader} onClick={onCancelClick}>
        {t('button.cancelSignup')}
      </Button>

      {signupSubmitted && <SuccessMessage>{t('signupSaved')}</SuccessMessage>}

      {checkForSignupChanges(signedGames, selectedGames, dispatch) && (
        <InfoMessage>{t('signupUnsavedChanges')}</InfoMessage>
      )}

      {!leader && <p className='bold'>{t('signupDisabledNotLeader')}</p>}
      {leader && groupCode !== '0' && (
        <p className='bold'>{t('signupForWholeGroup')}</p>
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
