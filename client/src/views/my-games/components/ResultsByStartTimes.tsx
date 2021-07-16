import React, { ReactElement, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { timeFormatter } from 'client/utils/timeFormatter';
import { SelectedGame } from 'shared/typings/models/user';
import { CancelSignupForm } from './CancelSignupForm';
import { Button } from 'client/components/Button';

export interface Props {
  signups: readonly SelectedGame[];
  startTimes: readonly string[];
  missedSignups: readonly string[];
}

export const ResultsByStartTimes = ({
  signups,
  startTimes,
  missedSignups,
}: Props): ReactElement => {
  const [showCancelSignupForm, setShowCancelSignupForm] = useState<String[]>(
    []
  );
  const { t } = useTranslation();
  return (
    <div className='start-times-list'>
      {startTimes.map((startTime) => {
        return (
          <div key={startTime}>
            <p className='bold'>
              {timeFormatter.getWeekdayAndTime({
                time: startTime,
                capitalize: true,
              })}
            </p>
            {signups.map((signup) => {
              const cancelSignupFormVisible = showCancelSignupForm.find(
                (signupform) => signupform === signup.gameDetails.gameId
              );
              const onCancelForm = (): void => {
                setShowCancelSignupForm(
                  showCancelSignupForm.filter(
                    (signupform) => signupform !== signup.gameDetails.gameId
                  )
                );
              };

              const onCancelSignup = (): void => {
                setShowCancelSignupForm(
                  showCancelSignupForm.filter(
                    (signupform) => signupform !== signup.gameDetails.gameId
                  )
                );
              };
              const onConfirmCancelSignup = (): void => {
                setShowCancelSignupForm([
                  ...showCancelSignupForm,
                  signup.gameDetails.gameId,
                ]);
              };
              if (signup.time === startTime) {
                return (
                  <GameDetailsList key={signup.gameDetails.gameId}>
                    <Link to={`/games/${signup.gameDetails.gameId}`}>
                      {signup.gameDetails.title}
                    </Link>
                    <ButtonContainer>
                      {cancelSignupFormVisible ? (
                        <CancelSignupForm
                          game={signup.gameDetails}
                          onCancelForm={onCancelForm}
                          onCancelSignup={onCancelSignup}
                        />
                      ) : (
                        <Button onClick={() => onConfirmCancelSignup()}>
                          {t('button.cancelSignup')}
                        </Button>
                      )}
                    </ButtonContainer>
                  </GameDetailsList>
                );
              }
            })}
            {missedSignups.map((missedSignup) => {
              if (missedSignup === startTime) {
                return (
                  <GameDetailsList key={missedSignup}>
                    {t('noSignupResult')}
                  </GameDetailsList>
                );
              }
            })}
          </div>
        );
      })}
    </div>
  );
};

const GameDetailsList = styled.p`
  padding-left: 30px;
`;

const ButtonContainer = styled.span`
  padding-left: 10px;
`;
