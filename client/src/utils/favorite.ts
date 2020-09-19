import { Game } from 'typings/game.typings';
import { submitUpdateFavorites } from 'views/my-games/myGamesActions';
import { Dispatch } from 'redux';

export interface UpdateFavoriteOpts {
  game: Game;
  action: string;
  favoritedGames: readonly Game[];
  username: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dispatch: Dispatch<any>;
}

export const updateFavorite = async (
  updateFavoriteOpts: UpdateFavoriteOpts
): Promise<void> => {
  const {
    game,
    action,
    favoritedGames,
    username,
    dispatch,
  } = updateFavoriteOpts;

  if (!game || !game.gameId) return;

  const gameIndex = favoritedGames.findIndex(
    (favoritedGame) => favoritedGame.gameId === game.gameId
  );
  const allFavoritedGames = favoritedGames.slice();

  if (action === 'add' && gameIndex === -1) {
    allFavoritedGames.push(game);
  } else if (action === 'del' && gameIndex > -1) {
    allFavoritedGames.splice(gameIndex, 1);
  }

  const favoriteData = {
    username: username,
    favoritedGames: allFavoritedGames,
  };

  try {
    await dispatch(submitUpdateFavorites(favoriteData));
  } catch (error) {
    throw new Error(`submitUpdateFavorites error: ${error}`);
  }
};
