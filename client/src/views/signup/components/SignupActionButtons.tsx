import React, { FC, ReactElement } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { Signup } from 'typings/user.typings';
import { updateUnsavedChangesStatus } from 'views/signup/signupActions';

interface Props {
  groupCode: string;
  leader: boolean;
  onCancelClick: (event: React.MouseEvent) => void;
  onSubmitClick: (event: React.MouseEvent) => void;
  selectedGames: readonly Signup[];
  signedGames: readonly Signup[];
  signupError: string;
  signupSubmitted: boolean;
  submitting: boolean;
}

export const SignupActionButtons: FC<Props> = (props: Props): ReactElement => {
  const {
    groupCode,
    leader,
    onCancelClick,
    onSubmitClick,
    selectedGames,
    signedGames,
    signupError,
    signupSubmitted,
    submitting,
  } = props;

  const dispatch = useDispatch();
  const { t } = useTranslation();

  const checkForSignupChanges = (
    signedGames: readonly Signup[],
    selectedGames: readonly Signup[]
  ): boolean => {
    const filteredSignedGames = signedGames.filter((signedGame) => {
      return selectedGames.find((selectedGame) => {
        return (
          signedGame.gameDetails.gameId === selectedGame.gameDetails.gameId
        );
      });
    });

    const filteredSelectedGames = selectedGames.filter((selectedGame) => {
      return signedGames.find((signedGame) => {
        return (
          selectedGame.gameDetails.gameId === signedGame.gameDetails.gameId
        );
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

  return (
    <div className='signup-action-buttons-row'>
      <button disabled={submitting || !leader} onClick={onSubmitClick}>
        {t('button.signup')}
      </button>

      <button disabled={submitting || !leader} onClick={onCancelClick}>
        {t('button.cancelSignup')}
      </button>

      {signupSubmitted && <SuccessMessage>{t('signupSaved')}</SuccessMessage>}

      {checkForSignupChanges(signedGames, selectedGames) && (
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
