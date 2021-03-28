import {
  FavoritedGame,
  SaveFavoriteRequest,
} from 'server/typings/user.typings';
import { Status } from 'shared/typings/api/games';
import { saveFavorite } from 'server/features/user/userRepository';

interface PostFavoriteResponse {
  message: string;
  status: Status;
  error?: Error;
  favoritedGames?: readonly FavoritedGame[];
}

// Add favorite data for user
export const storeFavorite = async (
  favoriteData: SaveFavoriteRequest
): Promise<PostFavoriteResponse> => {
  let saveFavoriteResponse;
  try {
    saveFavoriteResponse = await saveFavorite(favoriteData);
  } catch (error) {
    return {
      message: 'Update favorite failure',
      status: 'error',
      error,
    };
  }

  if (saveFavoriteResponse) {
    return {
      message: 'Update favorite success',
      status: 'success',
      favoritedGames: saveFavoriteResponse.favoritedGames,
    };
  }

  return {
    message: 'Update favorite failure',
    status: 'error',
  };
};
