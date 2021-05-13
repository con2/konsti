import React, { FC, ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory, useParams } from 'react-router-dom';
import { submitUpdateHidden } from 'client/views/admin/adminActions';
import { FeedbackForm } from 'client/views/all-games/components/FeedbackForm';
import { GameInfo } from 'client/views/all-games/components/GameInfo';
import { Loading } from 'client/components/Loading';
import { Game } from 'shared/typings/models/game';
import { updateFavorite, UpdateFavoriteOpts } from 'client/utils/favorite';
import { useAppDispatch, useAppSelector } from 'client/utils/hooks';

export const GameDetails: FC = (): ReactElement => {
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
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const foundGame = games.find((game) => game.gameId === gameId);

  const [hidden, setHidden] = React.useState<boolean>(false);
  const [favorited, setFavorited] = React.useState<boolean>(false);
  const [submitting, setSubmitting] = React.useState<boolean>(false);
  const [loading, setLoading] = React.useState<boolean>(true);

  React.useEffect(() => {
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
    };

    checkGameState();
    setLoading(false);
  }, [foundGame, favoritedGames, hiddenGames]);

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

  return (
    <div className='game-details-view'>
      <div className='details-button-row'>
        <button
          onClick={() => {
            if (history.action === 'PUSH') {
              history.goBack();
            } else {
              history.push('/');
            }
          }}
        >
          {t('button.back')}
        </button>

        {favorited && loggedIn && userGroup === 'user' && foundGame && (
          <button
            disabled={submitting}
            onClick={async () => await updateFavoriteHandler('del')}
          >
            {t('button.removeFavorite')}
          </button>
        )}

        {!favorited && loggedIn && userGroup === 'user' && foundGame && (
          <button
            disabled={submitting}
            onClick={async () => await updateFavoriteHandler('add')}
          >
            {t('button.favorite')}
          </button>
        )}

        {hidden && loggedIn && userGroup === 'admin' && foundGame && (
          <button
            disabled={submitting}
            onClick={async () => await updateHidden('del')}
          >
            {t('button.show')}
          </button>
        )}

        {!hidden && loggedIn && userGroup === 'admin' && foundGame && (
          <button
            disabled={submitting}
            onClick={async () => await updateHidden('add')}
          >
            {t('button.hide')}
          </button>
        )}
      </div>

      {loading && <Loading />}

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
