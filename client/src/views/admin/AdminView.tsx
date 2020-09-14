import React, { FC, ReactElement, ChangeEvent } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { Hidden } from 'views/admin/components/Hidden';
import {
  submitSignupTime,
  submitToggleAppOpen,
} from 'views/admin/adminActions';
import { submitPlayersAssign } from 'views/results/resultsActions';
import { submitGamesUpdate } from 'views/all-games/allGamesActions';
import { TimesDropdown } from 'components/TimesDropdown';
import { timeFormatter } from 'utils/timeFormatter';
import { Game } from 'typings/game.typings';
import { RootState } from 'typings/redux.typings';

export const AdminView: FC = (): ReactElement => {
  const games: readonly Game[] = useSelector(
    (state: RootState) => state.allGames.games
  );
  const signupTime: string = useSelector(
    (state: RootState) => state.admin.signupTime
  );
  const appOpen: boolean = useSelector(
    (state: RootState) => state.admin.appOpen
  );
  const hiddenGames: readonly Game[] = useSelector(
    (state: RootState) => state.admin.hiddenGames
  );
  const responseMessage: string = useSelector(
    (state: RootState) => state.admin.responseMessage
  );

  const dispatch = useDispatch();
  const { t } = useTranslation();

  const [submitting, setSubmitting] = React.useState<boolean>(false);
  const [message, setMessage] = React.useState<string>('');
  const [messageStyle, setMessageStyle] = React.useState<string>('');
  const [selectedSignupTime, setSelectedSignupTime] = React.useState<string>(
    signupTime
  );

  const showMessage = ({
    message,
    style,
  }: {
    message: string;
    style: string;
  }): void => {
    setMessage(message);
    setMessageStyle(style);
  };

  const getVisibleGames = (): readonly Game[] => {
    if (!hiddenGames) return games;
    const visibleGames: Game[] = [];
    for (let i = 0; i < games.length; i += 1) {
      let match = false;

      for (let j = 0; j < hiddenGames.length; j += 1) {
        if (games[i].gameId === hiddenGames[j].gameId) {
          match = true;
          break;
        }
      }
      if (!match) {
        visibleGames.push(games[i]);
      }
    }
    return visibleGames;
  };

  const getStartingTimes = (): string[] => {
    const visibleGames = getVisibleGames();
    const startTimes = visibleGames.map((game) => game.startTime);
    return [...Array.from(new Set(startTimes))].sort();
  };

  const submitUpdate = async (): Promise<void> => {
    setSubmitting(true);
    try {
      await dispatch(submitGamesUpdate());
    } catch (error) {
      console.log(`submitGamesUpdate error:`, error);
    }
    setSubmitting(false);
  };

  const submitAssign = async (): Promise<void> => {
    setSubmitting(true);

    try {
      await dispatch(submitPlayersAssign(signupTime));
    } catch (error) {
      showMessage({
        message: error.message,
        style: 'error',
      });
      return;
    }
    setSubmitting(false);
  };

  const submitTime = async (): Promise<void> => {
    setSubmitting(true);
    try {
      await dispatch(submitSignupTime(selectedSignupTime));
    } catch (error) {
      console.log(`submitSignupTime error:`, error);
    }
    setSubmitting(false);
  };

  const toggleAppOpen = async (): Promise<void> => {
    setSubmitting(true);
    try {
      await dispatch(submitToggleAppOpen(!appOpen));
    } catch (error) {
      console.log(`submitToggleAppOpen error:`, error);
    }
    setSubmitting(false);
  };

  return (
    <div className='admin-view'>
      <>
        <div className='admin-button-row'>
          <button
            disabled={submitting}
            onClick={() => {
              submitUpdate();
            }}
          >
            {t('button.updateDb')}
          </button>

          <button
            disabled={submitting}
            onClick={() => {
              submitAssign();
            }}
          >
            {t('button.assignPlayers')}
          </button>

          <button
            disabled={submitting}
            onClick={() => {
              toggleAppOpen();
            }}
          >
            {appOpen ? t('button.closeApp') : t('button.openApp')}
          </button>
        </div>

        {submitting && <p>{t('loading')}</p>}

        <ResponseMessage>{responseMessage}</ResponseMessage>

        {(!games || games.length === 0) && <p>{t('noGamesInDatabase')}</p>}

        {games && games.length !== 0 && (
          <>
            <StatusMessage className={messageStyle}>{message}</StatusMessage>

            <p>{t('activeTimeDescription')}</p>

            <div className={'signup-open'}>
              {signupTime && (
                <p>
                  {t('activeTime')}:{' '}
                  {timeFormatter.weekdayAndTime({
                    time: signupTime,
                    capitalize: true,
                  })}
                </p>
              )}
              {!signupTime && <p>{t('noActiveTime')}</p>}
            </div>

            <button
              disabled={submitting}
              onClick={() => {
                submitTime();
              }}
            >
              {t('button.saveTime')}
            </button>

            <TimesDropdown
              times={getStartingTimes()}
              selectedTime={selectedSignupTime}
              onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                setSelectedSignupTime(event.target.value)
              }
            />

            <Hidden hiddenGames={hiddenGames} />
          </>
        )}
      </>
    </div>
  );
};

const StatusMessage = styled.p`
  &.error {
    color: ${(props) => props.theme.error};
  }

  &.success {
    color: ${(props) => props.theme.success};
  }
`;

const ResponseMessage = styled.p`
  color: ${(props) => props.theme.success};
`;
