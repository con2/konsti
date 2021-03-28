import { logger } from 'server/utils/logger';
import {
  FavoritedGame,
  SaveFavoriteRequest,
} from 'server/typings/user.typings';
import { Status } from 'shared/typings/api/games';
import { saveFavorite } from 'server/db/user/userService';

interface PostFavoriteResponse {
  message: string;
  status: Status;
  error?: Error;
  favoritedGames?: readonly FavoritedGame[];
}

// Add favorite data for user
export const postFavorite = async (
  favoriteData: SaveFavoriteRequest
): Promise<PostFavoriteResponse> => {
  logger.info('API call: POST /api/favorite');

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
