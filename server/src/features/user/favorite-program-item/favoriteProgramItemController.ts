import { Request, Response } from "express";
import { logger } from "server/utils/logger";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { PostFavoriteRequestSchema } from "shared/types/api/favorite";
import { getAuthorizedUsername } from "server/utils/authHeader";
import { UserGroup } from "shared/types/models/user";
import { storeFavorite } from "server/features/user/favorite-program-item/favoriteProgramItemService";

export const postFavorite = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  logger.info(`API call: POST ${ApiEndpoint.FAVORITE}`);

  const username = getAuthorizedUsername(
    req.headers.authorization,
    UserGroup.USER,
  );
  if (!username) {
    return res.sendStatus(401);
  }

  const result = PostFavoriteRequestSchema.safeParse(req.body);
  if (!result.success) {
    logger.error(
      "%s",
      new Error(`Error validating postFavorite body: ${result.error}`),
    );
    return res.sendStatus(422);
  }

  const response = await storeFavorite({
    username,
    favoriteProgramItemIds: result.data.favoriteProgramItemIds,
  });
  return res.json(response);
};
