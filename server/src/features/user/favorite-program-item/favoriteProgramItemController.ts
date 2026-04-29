import { Request, Response } from "express";
import { PostFavoriteRequest } from "shared/types/api/favorite";
import { getAuthUsername } from "server/middleware/requireAuth";
import { storeFavorite } from "server/features/user/favorite-program-item/favoriteProgramItemService";

export const postFavorite = async (
  req: Request<unknown, unknown, PostFavoriteRequest>,
  res: Response,
): Promise<Response> => {
  const response = await storeFavorite({
    username: getAuthUsername(req),
    favoriteProgramItemIds: req.body.favoriteProgramItemIds,
  });
  return res.json(response);
};
