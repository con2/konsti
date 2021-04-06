import { SaveFavoriteRequest } from 'server/typings/user.typings';
import { saveFavorite } from 'server/features/user/userRepository';
import { ServerError } from 'shared/typings/api/errors';
import { PostFavoriteResponse } from 'shared/typings/api/favorite';

export const storeFavorite = async (
  favoriteData: SaveFavoriteRequest
): Promise<PostFavoriteResponse | ServerError> => {
  let favoritedGames;
  try {
    favoritedGames = await saveFavorite(favoriteData);
  } catch (error) {
    return {
      message: 'Update favorite failure',
      status: 'error',
      code: 0,
    };
  }

  if (favoritedGames) {
    return {
      message: 'Update favorite success',
      status: 'success',
      favoritedGames,
    };
  }

  return {
    message: 'Update favorite failure',
    status: 'error',
    code: 0,
  };
};
