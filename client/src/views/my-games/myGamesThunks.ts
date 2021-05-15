import { getUser } from 'client/services/userServices';
import { postFavorite } from 'client/services/favoriteServices';
import { AppThunk } from 'client/typings/utils.typings';
import { SaveFavoriteRequest } from 'shared/typings/api/favorite';
import {
  submitGetUserAsync,
  submitUpdateFavoritesAsync,
} from 'client/views/my-games/myGamesSlice';

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

export const submitUpdateFavorites = (
  favoriteData: SaveFavoriteRequest
): AppThunk => {
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
