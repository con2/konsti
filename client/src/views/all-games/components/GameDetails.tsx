import React, { ReactElement, useState, useEffect, ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory, useParams } from 'react-router-dom';
import {
  submitAddSignupMessage,
  submitDeleteSignupMessage,
  submitUpdateHidden,
} from 'client/views/admin/adminThunks';
import { FeedbackForm } from 'client/views/all-games/components/FeedbackForm';
import { GameInfo } from 'client/views/all-games/components/GameInfo';
import { Loading } from 'client/components/Loading';
import { Game } from 'shared/typings/models/game';
import { updateFavorite, UpdateFavoriteOpts } from 'client/utils/favorite';
import { useAppDispatch, useAppSelector } from 'client/utils/hooks';
import { Button } from 'client/components/Button';
import styled from 'styled-components';

export const GameDetails = (): ReactElement => {
  const history = useHistory();
  // @ts-expect-error: Property 'gameId' does not exist on type '{}'.
  const { gameId } = useParams();

  const username = useAppSelector((state) => state.login.username);
  const loggedIn = useAppSelector((state) => state.login.loggedIn);
  const games = useAppSelector((state) => state.allGames.games);
  const userGroup = useAppSelector((state) => state.login.userGroup);
  const favoritedGames = useAppSelector(
    (state) => state.myGames.favoritedGames
  );
  const hiddenGames = useAppSelector((state) => state.admin.hiddenGames);
  const signupMessages = useAppSelector((state) => state.admin.signupMessages);
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const foundGame = games.find((game) => game.gameId === gameId);

  const [hidden, setHidden] = useState<boolean>(false);
  const [favorited, setFavorited] = useState<boolean>(false);
  const [hasSignupMessage, setHasSignupMessage] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const [signupMessageInput, setSignupMessageInput] = useState<string>('');
  const [signupMessageInputVisible, setSignupMessageInputVisible] =
    useState<boolean>(false);

  useEffect(() => {
    setLoading(true);

    const checkGameState = (): void => {
      if (!foundGame || !foundGame.gameId) return;

      // Check if in favorites
      favoritedGames.find((favoritedGame) => {
        if (favoritedGame.gameId === foundGame.gameId) {
          setFavorited(true);
        }
      });

      // Check if hidden
      hiddenGames.find((hiddenGame) => {
        if (hiddenGame.gameId === foundGame.gameId) {
          setHidden(true);
        }
      });

      // Check if signup message exinsts
      signupMessages.find((signupMessageForGame) => {
        if (signupMessageForGame.gameId === foundGame.gameId) {
          setHasSignupMessage(true);
        }
      });
    };

    checkGameState();
    setLoading(false);
  }, [foundGame, favoritedGames, hiddenGames, signupMessages]);

  // Favorite / remove favorite clicked
  const updateFavoriteHandler = async (action: string): Promise<void> => {
    if (!foundGame || !foundGame.gameId) return;

    setSubmitting(true);
    const updateFavoriteOpts: UpdateFavoriteOpts = {
      game: foundGame,
      action,
      username,
      favoritedGames,
      dispatch,
    };

    await updateFavorite(updateFavoriteOpts);

    setSubmitting(false);

    if (action === 'add') {
      setFavorited(true);
    } else if (action === 'del') {
      setFavorited(false);
    }
  };

  // Hide / show clicked
  const updateHidden = async (action: string): Promise<void> => {
    if (!foundGame || !foundGame.gameId) return;

    setSubmitting(true);
    const gameIndex = findGame(foundGame.gameId, hiddenGames);
    const allHiddenGames = hiddenGames.slice();

    if (action === 'add') {
      if (gameIndex === -1) {
        allHiddenGames.push(foundGame);
      }
    } else if (action === 'del') {
      if (gameIndex > -1) {
        allHiddenGames.splice(gameIndex, 1);
      }
    }

    try {
      await dispatch(submitUpdateHidden(allHiddenGames));
    } catch (error) {
      throw new Error(`submitUpdateHidden error: ${error}`);
    }

    setSubmitting(false);

    if (action === 'add') {
      setHidden(true);
    } else if (action === 'del') {
      setHidden(false);
    }
  };

  const handleSignupMessageChange = (
    event: ChangeEvent<HTMLInputElement>
  ): void => {
    setSignupMessageInput(event.target.value);
  };

  const onSubmitAddSignupMessageClick = (): void => {
    if (!foundGame) return;
    dispatch(
      submitAddSignupMessage({
        gameId: foundGame.gameId,
        message: signupMessageInput,
      })
    );
    setSignupMessageInputVisible(false);
    setSignupMessageInput('');
  };

  const submitRemoveSignupMessage = (): void => {
    if (!foundGame) return;
    dispatch(submitDeleteSignupMessage(foundGame.gameId));
    setHasSignupMessage(false);
  };

  return (
    <div className='game-details-view'>
      <div className='details-button-row'>
        <Button
          onClick={() => {
            if (history.action === 'PUSH') {
              history.goBack();
            } else {
              history.push('/');
            }
          }}
        >
          {t('button.back')}
        </Button>

        {favorited && loggedIn && userGroup === 'user' && foundGame && (
          <Button
            disabled={submitting}
            onClick={async () => await updateFavoriteHandler('del')}
          >
            {t('button.removeFavorite')}
          </Button>
        )}

        {!favorited && loggedIn && userGroup === 'user' && foundGame && (
          <Button
            disabled={submitting}
            onClick={async () => await updateFavoriteHandler('add')}
          >
            {t('button.favorite')}
          </Button>
        )}

        {hidden && loggedIn && userGroup === 'admin' && foundGame && (
          <Button
            disabled={submitting}
            onClick={async () => await updateHidden('del')}
          >
            {t('button.show')}
          </Button>
        )}

        {!hidden && loggedIn && userGroup === 'admin' && foundGame && (
          <Button
            disabled={submitting}
            onClick={async () => await updateHidden('add')}
          >
            {t('button.hide')}
          </Button>
        )}

        {!hasSignupMessage &&
          !signupMessageInputVisible &&
          loggedIn &&
          userGroup === 'admin' &&
          foundGame && (
            <Button
              disabled={submitting}
              onClick={() => setSignupMessageInputVisible(true)}
            >
              {t('button.addSignupMessage')}
            </Button>
          )}

        {!hasSignupMessage &&
          signupMessageInputVisible &&
          loggedIn &&
          userGroup === 'admin' &&
          foundGame && (
            <Button
              disabled={submitting}
              onClick={() => setSignupMessageInputVisible(false)}
            >
              {t('button.cancel')}
            </Button>
          )}

        {hasSignupMessage && loggedIn && userGroup === 'admin' && foundGame && (
          <Button
            disabled={submitting}
            onClick={() => submitRemoveSignupMessage()}
          >
            {t('button.removeSignupMessage')}
          </Button>
        )}
      </div>

      {loading && <Loading />}

      {signupMessageInputVisible && (
        <>
          <p>{t('gameDetails.addSignupTextField')}</p>
          <FormInput
            type={'text'}
            key='new-password'
            placeholder={t('gameDetails.addSignupTextField')}
            value={signupMessageInput}
            onChange={handleSignupMessageChange}
          />
          <Button onClick={onSubmitAddSignupMessageClick}>
            {t('button.save')}
          </Button>
        </>
      )}

      {!loading && !foundGame && (
        <div className='game-not-found'>
          {t('invalidGameId')} {gameId}.
        </div>
      )}

      {!loading && foundGame && (
        <>
          <GameInfo game={foundGame} />
          {loggedIn && <FeedbackForm game={foundGame} />}
        </>
      )}
    </div>
  );
};

// Find selected game index
const findGame = (gameId: string, array: readonly Game[]): number => {
  for (let i = 0; i < array.length; i += 1) {
    if (array[i].gameId === gameId) {
      return i;
    }
  }
  return -1;
};

const FormInput = styled.input`
  border: 1px solid ${(props) => props.theme.borderInactive};
  color: ${(props) => props.theme.buttonText};
  height: 34px;
  padding: 0 0 0 10px;
  width: 100%;
`;
