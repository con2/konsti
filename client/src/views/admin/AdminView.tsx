import React, { ReactElement, ChangeEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { Hidden } from 'client/views/admin/components/Hidden';
import {
  submitSignupTime,
  submitToggleAppOpen,
} from 'client/views/admin/adminThunks';
import { submitPlayersAssign } from 'client/views/results/resultsThunks';
import { submitGamesUpdate } from 'client/views/all-games/allGamesThunks';
import { TimesDropdown } from 'client/components/TimesDropdown';
import { timeFormatter } from 'client/utils/timeFormatter';
import { Game } from 'shared/typings/models/game';
import { useAppDispatch, useAppSelector } from 'client/utils/hooks';

export const AdminView = (): ReactElement => {
  const games = useAppSelector((state) => state.allGames.games);
  const activeSignupTime = useAppSelector(
    (state) => state.admin.activeSignupTime
  );
  const appOpen = useAppSelector((state) => state.admin.appOpen);
  const hiddenGames = useAppSelector((state) => state.admin.hiddenGames);
  const responseMessage = useAppSelector(
    (state) => state.admin.responseMessage
  );

  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [messageStyle, setMessageStyle] = useState<string>('');
  const [selectedSignupTime, setSelectedSignupTime] =
    useState<string>(activeSignupTime);

  const showMessage = ({
    value,
    style,
  }: {
    value: string;
    style: string;
  }): void => {
    setMessage(value);
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
      console.log(`submitGamesUpdate error:`, error); // eslint-disable-line no-console
    }
    setSubmitting(false);
  };

  const submitAssign = async (): Promise<void> => {
    setSubmitting(true);

    try {
      await dispatch(submitPlayersAssign(activeSignupTime));
    } catch (error) {
      showMessage({
        value: error.message,
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
      console.log(`submitSignupTime error:`, error); // eslint-disable-line no-console
    }
    setSubmitting(false);
  };

  const toggleAppOpen = async (): Promise<void> => {
    setSubmitting(true);
    try {
      await dispatch(submitToggleAppOpen(!appOpen));
    } catch (error) {
      console.log(`submitToggleAppOpen error:`, error); // eslint-disable-line no-console
    }
    setSubmitting(false);
  };

  return (
    <div className='admin-view'>
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
            {activeSignupTime && (
              <p>
                {t('activeTime')}:{' '}
                {timeFormatter.getWeekdayAndTime({
                  time: activeSignupTime,
                  capitalize: true,
                })}
              </p>
            )}
            {!activeSignupTime && <p>{t('noActiveTime')}</p>}
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
