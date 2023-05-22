import { Request, Response } from "express";
import { ZodError } from "zod";
import { logger } from "server/utils/logger";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import {
  PostFavoriteRequest,
  PostFavoriteRequestSchema,
} from "shared/typings/api/favorite";
import { isAuthorized } from "server/utils/authHeader";
import { UserGroup } from "shared/typings/models/user";
import { storeFavorite } from "server/features/user/favorite-game/favoriteGameService";

export const postFavorite = async (
  req: Request<{}, {}, PostFavoriteRequest>,
  res: Response
): Promise<Response> => {
  logger.info(`API call: POST ${ApiEndpoint.FAVORITE}`);

  const username = isAuthorized(req.headers.authorization, UserGroup.USER);
  if (!username) {
    return res.sendStatus(401);
  }

  let body;
  try {
    body = PostFavoriteRequestSchema.parse(req.body);
  } catch (error) {
    if (error instanceof ZodError) {
      logger.error(`Error validating postFavorite body: ${error.message}`);
    }
    return res.sendStatus(422);
  }

  const response = await storeFavorite({
    username,
    favoritedGameIds: body.favoritedGameIds,
  });
  return res.json(response);
};
