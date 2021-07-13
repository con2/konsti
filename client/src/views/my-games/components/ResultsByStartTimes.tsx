import React, { ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { timeFormatter } from 'client/utils/timeFormatter';
import { SelectedGame } from 'shared/typings/models/user';
import { Button } from 'client/components/Button';
import { Game } from 'shared/typings/models/game';
import { submitDeleteGame } from 'client/views/signup/signupThunks';
import { useAppDispatch, useAppSelector } from 'client/utils/hooks';

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
  const { t } = useTranslation();

  const dispatch = useAppDispatch();
  const username = useAppSelector((state) => state.login.username);

  const removeSignup = async (gameToRemove: Game): Promise<void> => {
    await dispatch(
      submitDeleteGame({
        username,
        startTime: gameToRemove.startTime,
        enteredGameId: gameToRemove.gameId,
      })
    );
  };

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
              if (signup.time === startTime) {
                return (
                  <GameDetailsList key={signup.gameDetails.gameId}>
                    <Link to={`/games/${signup.gameDetails.gameId}`}>
                      {signup.gameDetails.title}
                    </Link>
                    <ButtonPlacement>
                      <Button
                        onClick={async () =>
                          await removeSignup(signup.gameDetails)
                        }
                      >
                        {' '}
                        {t('button.cancel')}{' '}
                      </Button>
                    </ButtonPlacement>
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

const ButtonPlacement = styled.span`
  padding-left: 10px;
`;
