import React, { FC, ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import { submitSignup, submitSelectedGames } from 'views/signup/signupActions';
import { DragAndDropList } from 'views/signup/components/DragAndDropList';
import { sleep } from 'utils/sleep';
import { config } from 'config';
import { Game } from 'typings/game.typings';
import { Signup } from 'typings/user.typings';
import { RootState } from 'typings/redux.typings';
import { filterAvailableGames } from '../utils/filterAvailableGames';
import { filterSelectedGames } from '../utils/filterSelectedGames';
import { SignupTimeButtons } from './SignupTimeButtons';
import { SignupInfo } from './SignupInfo';
import { SignupActionButtons } from './SignupActionButtons';

export interface Props {
  games: readonly Game[];
  signupTimes: readonly string[];
  leader: boolean;
}

export const SignupList: FC<Props> = (props: Props): ReactElement => {
  const { games, signupTimes, leader } = props;

  const signupTime: string = useSelector(
    (state: RootState) => state.signup.signupTime
  );
  const username: string = useSelector(
    (state: RootState) => state.login.username
  );
  const groupCode: string = useSelector(
    (state: RootState) => state.login.groupCode
  );
  const hiddenGames: readonly Game[] = useSelector(
    (state: RootState) => state.admin.hiddenGames
  );
  const signedGames: readonly Signup[] = useSelector(
    (state: RootState) => state.myGames.signedGames
  );
  const selectedGames: readonly Signup[] = useSelector(
    (state: RootState) => state.signup.selectedGames
  );
  const unsavedChanges: boolean = useSelector(
    (state: RootState) => state.signup.unsavedChanges
  );

  const dispatch = useDispatch();
  const { t } = useTranslation();

  const [submitting, setSubmitting] = React.useState<boolean>(false);
  const [signupSubmitted, setSignupSubmitted] = React.useState<boolean>(false);
  const [signupError, setSignupError] = React.useState<string>('');

  React.useEffect(() => {
    if (!unsavedChanges) {
      dispatch(submitSelectedGames(signedGames));
    }
  }, [unsavedChanges, signedGames]);

  const onSubmitClick = async (): Promise<void> => {
    setSubmitting(true);

    const signupData = {
      username,
      selectedGames,
      signupTime,
    };

    try {
      await dispatch(submitSignup(signupData));
    } catch (error) {
      switch (error.code) {
        case 41:
          showMessage('signupEnded');
          return;
        default:
          showMessage('signupError');
          return;
      }
    }

    showMessage('signupSubmitted');
    setSubmitting(false);
  };

  const onCancelClick = async (): Promise<void> => {
    setSubmitting(true);

    const gamesWithDifferentTime = selectedGames.filter((selectedGame) => {
      if (selectedGame.time !== signupTime) {
        return selectedGame;
      }
    });

    const signupData = {
      username,
      selectedGames: gamesWithDifferentTime,
      signupTime: signupTime,
    };

    try {
      await dispatch(submitSignup(signupData));
    } catch (error) {
      switch (error.code) {
        case 41:
          showMessage('signupEnded');
          return;
        default:
          showMessage('signupError');
          return;
      }
    }

    showMessage('signupSubmitted');
    setSubmitting(false);
  };

  const updateSelectedGames = (newSelectedGames: Game[]): void => {
    const newSignups = newSelectedGames.map((newSelectedGame) => {
      return {
        gameDetails: { ...newSelectedGame },
        priority: newSelectedGames.indexOf(newSelectedGame) + 1,
        time: signupTime,
      };
    });

    const existingGames = selectedGames.filter(
      (selectedGame) => selectedGame.gameDetails.startTime !== signupTime
    );
    const combined = existingGames.concat(newSignups);
    dispatch(submitSelectedGames(combined));
  };

  const showMessage = async (message: string): Promise<void> => {
    if (message === 'signupSubmitted') {
      setSignupSubmitted(true);
    } else if (message === 'signupError') {
      setSignupError('signupError');
    } else if (message === 'signupEnded') {
      setSignupError('signupEnded');
    }
    await sleep(config.MESSAGE_DELAY);
    setSignupSubmitted(false);
    setSignupError('');
  };

  return (
    <SignupListContainer>
      {signupTimes.length === 0 ? (
        <h2>{t('noOpenSignups')}</h2>
      ) : (
        <>
          <h2>{t('signupOpen')}</h2>
          <SignupTimeButtons
            signupTimes={signupTimes}
            signupTime={signupTime}
          />

          {signupTime && (
            <>
              <SignupInfo signupTime={signupTime} />

              <SignupActionButtons
                submitting={submitting}
                leader={leader}
                onSubmitClick={onSubmitClick}
                onCancelClick={onCancelClick}
                signupSubmitted={signupSubmitted}
                groupCode={groupCode}
                signedGames={signedGames}
                selectedGames={selectedGames}
                signupError={signupError}
              />

              <DragAndDropList
                availableGames={filterAvailableGames(
                  games,
                  hiddenGames,
                  selectedGames,
                  signupTime
                )}
                selectedGames={filterSelectedGames(selectedGames, signupTime)}
                updateSelectedGames={updateSelectedGames}
              />
            </>
          )}
        </>
      )}
    </SignupListContainer>
  );
};

const SignupListContainer = styled.div`
  margin: 0;
`;
