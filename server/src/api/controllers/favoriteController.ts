import { logger } from 'server/utils/logger';
import { db } from 'server/db/mongodb';
import {
  FavoritedGame,
  SaveFavoriteRequest,
} from 'server/typings/user.typings';
import { Status } from 'shared/typings/api/games';

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
    saveFavoriteResponse = await db.user.saveFavorite(favoriteData);
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
