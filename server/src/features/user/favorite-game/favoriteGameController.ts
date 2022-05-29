import { Request, Response } from "express";
import { z, ZodError } from "zod";
import { logger } from "server/utils/logger";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { SaveFavoriteRequest } from "shared/typings/api/favorite";
import { isAuthorized } from "server/utils/authHeader";
import { UserGroup } from "shared/typings/models/user";
import { storeFavorite } from "server/features/user/favorite-game/favoriteGameService";

export const postFavorite = async (
  req: Request<{}, {}, { favoriteData: SaveFavoriteRequest }>,
  res: Response
): Promise<Response> => {
  logger.info(`API call: POST ${ApiEndpoint.FAVORITE}`);

  const PostFavoriteParameters = z.object({
    username: z.string(),
    favoritedGameIds: z.array(z.string()),
  });

  let parameters;
  try {
    parameters = PostFavoriteParameters.parse(req.body);
  } catch (error) {
    if (error instanceof ZodError) {
      logger.error(
        `Error validating postFavorite parameters: ${error.message}`
      );
    }
    return res.sendStatus(422);
  }

  const favoriteData = parameters;

  if (
    !isAuthorized(
      req.headers.authorization,
      UserGroup.USER,
      favoriteData.username
    )
  ) {
    return res.sendStatus(401);
  }

  const response = await storeFavorite(favoriteData);
  return res.json(response);
};
