import React, { FC, ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory, useParams } from 'react-router-dom';
import { submitUpdateHidden } from 'views/admin/adminActions';
import { FeedbackForm } from 'views/all-games/components/FeedbackForm';
import { GameInfo } from 'views/all-games/components/GameInfo';
import { Loading } from 'components/Loading';
import { Game } from 'typings/game.typings';
import { updateFavorite, UpdateFavoriteOpts } from 'utils/favorite';

import { UserGroup } from 'typings/user.typings';
import { RootState } from 'typings/redux.typings';

export const GameDetails: FC = (): ReactElement => {
  const history = useHistory();
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  const { gameId } = useParams();

  const username: string = useSelector(
    (state: RootState) => state.login.username
  );
  const loggedIn: boolean = useSelector(
    (state: RootState) => state.login.loggedIn
  );
  const games: readonly Game[] = useSelector(
    (state: RootState) => state.allGames.games
  );
  const userGroup: UserGroup = useSelector(
    (state: RootState) => state.login.userGroup
  );
  const favoritedGames: readonly Game[] = useSelector(
    (state: RootState) => state.myGames.favoritedGames
  );
  const hiddenGames: readonly Game[] = useSelector(
    (state: RootState) => state.admin.hiddenGames
  );
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const game = games.find((game) => game.gameId === gameId);

  const [hidden, setHidden] = React.useState<boolean>(false);
  const [favorited, setFavorited] = React.useState<boolean>(false);
  const [submitting, setSubmitting] = React.useState<boolean>(false);
  const [loading, setLoading] = React.useState<boolean>(true);

  React.useEffect(() => {
    setLoading(true);

    const checkGameState = (): void => {
      if (!game || !game.gameId) return;

      // Check if in favorites
      favoritedGames.find((favoritedGame) => {
        if (favoritedGame.gameId === game.gameId) {
          setFavorited(true);
        }
      });

      // Check if hidden
      hiddenGames.find((hiddenGame) => {
        if (hiddenGame.gameId === game.gameId) {
          setHidden(true);
        }
      });
    };

    checkGameState();
    setLoading(false);
  }, [game, favoritedGames, hiddenGames]);

  // Find selected game index
  const findGame = (gameId: string, array: readonly Game[]): number => {
    for (let i = 0; i < array.length; i += 1) {
      if (array[i].gameId === gameId) {
        return i;
      }
    }
    return -1;
  };

  // Favorite / remove favorite clicked
  const updateFavoriteHandler = async (action: string): Promise<void> => {
    if (!game || !game.gameId) return;

    setSubmitting(true);
    const updateFavoriteOpts: UpdateFavoriteOpts = {
      game,
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
    if (!game || !game.gameId) return;

    setSubmitting(true);
    const gameIndex = findGame(game.gameId, hiddenGames);
    const allHiddenGames = hiddenGames.slice();

    if (action === 'add') {
      if (gameIndex === -1) {
        allHiddenGames.push(game);
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

        {favorited && loggedIn && userGroup === 'user' && game && (
          <button
            disabled={submitting}
            onClick={async () => await updateFavoriteHandler('del')}
          >
            {t('button.removeFavorite')}
          </button>
        )}

        {!favorited && loggedIn && userGroup === 'user' && game && (
          <button
            disabled={submitting}
            onClick={async () => await updateFavoriteHandler('add')}
          >
            {t('button.favorite')}
          </button>
        )}

        {hidden && loggedIn && userGroup === 'admin' && game && (
          <button
            disabled={submitting}
            onClick={async () => await updateHidden('del')}
          >
            {t('button.show')}
          </button>
        )}

        {!hidden && loggedIn && userGroup === 'admin' && game && (
          <button
            disabled={submitting}
            onClick={async () => await updateHidden('add')}
          >
            {t('button.hide')}
          </button>
        )}
      </div>

      {loading && <Loading />}

      {!loading && !game && (
        <div className='game-not-found'>
          {t('invalidGameId')} {gameId}.
        </div>
      )}

      {!loading && game && (
        <>
          <GameInfo game={game} />
          {loggedIn && <FeedbackForm game={game} />}
        </>
      )}
    </div>
  );
};
