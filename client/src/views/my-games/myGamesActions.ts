import { getUser } from 'services/userServices';
import { postFavorite } from 'services/favoriteServices';
import { FavoriteData, UserGames } from 'typings/user.typings';
import { Game } from 'typings/game.typings';
import { AppThunk } from 'typings/utils.typings';
import {
  SubmitGetUserAsync,
  SubmitUpdateFavoritesAsync,
  SUBMIT_GET_USER_GAMES,
  SUBMIT_UPDATE_FAVORITES,
} from 'typings/myGamesActions.typings';

export const submitGetUser = (username: string): AppThunk => {
  return async (dispatch): Promise<void> => {
    const getUserResponse = await getUser(username);

    if (getUserResponse?.status === 'error') {
      return await Promise.reject(getUserResponse);
    }

    if (getUserResponse?.status === 'success') {
      const enteredGames = getUserResponse.games.enteredGames;
      const favoritedGames = getUserResponse.games.favoritedGames;
      const signedGames = getUserResponse.games.signedGames;

      dispatch(
        submitGetUserAsync({
          enteredGames,
          favoritedGames,
          signedGames,
        })
      );
    }
  };
};

const submitGetUserAsync = ({
  enteredGames,
  favoritedGames,
  signedGames,
}: UserGames): SubmitGetUserAsync => {
  return {
    type: SUBMIT_GET_USER_GAMES,
    enteredGames,
    favoritedGames,
    signedGames,
  };
};

export const submitUpdateFavorites = (favoriteData: FavoriteData): AppThunk => {
  return async (dispatch): Promise<void> => {
    const updateFavoriteResponse = await postFavorite(favoriteData);

    if (updateFavoriteResponse?.status === 'error') {
      return await Promise.reject(updateFavoriteResponse);
    }

    if (updateFavoriteResponse?.status === 'success') {
      dispatch(
        submitUpdateFavoritesAsync(updateFavoriteResponse.favoritedGames)
      );
    }
  };
};

const submitUpdateFavoritesAsync = (
  favoritedGames: readonly Game[]
): SubmitUpdateFavoritesAsync => {
  return {
    type: SUBMIT_UPDATE_FAVORITES,
    favoritedGames,
  };
};
