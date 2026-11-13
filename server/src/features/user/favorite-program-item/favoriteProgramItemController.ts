import { Request, Response } from "express";
import { PostFavoriteRequest } from "shared/types/api/favorite";
import { storeFavorite } from "server/features/user/favorite-program-item/favoriteProgramItemService";
import { getAuthUserId } from "server/middleware/requireAuth";

export const postFavorite = async (
  req: Request<unknown, unknown, PostFavoriteRequest>,
  res: Response,
): Promise<Response> => {
  const response = await storeFavorite({
    userId: getAuthUserId(req),
    favoriteProgramItemIds: req.body.favoriteProgramItemIds,
  });
  return res.json(response);
};
