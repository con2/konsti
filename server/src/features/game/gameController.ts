import { Request, Response } from "express";
import { getAuthorizedUsername } from "server/utils/authHeader";
import { UserGroup } from "shared/typings/models/user";
import { fetchGames, updateGames } from "server/features/game/gamesService";
import { logger } from "server/utils/logger";
import { ApiEndpoint } from "shared/constants/apiEndpoints";

export const postUpdateGames = async (
  req: Request<{}, {}, {}>,
  res: Response
): Promise<Response> => {
  logger.info(`API call: POST ${ApiEndpoint.GAMES}`);

  const username = getAuthorizedUsername(
    req.headers.authorization,
    UserGroup.ADMIN
  );
  if (!username) {
    return res.sendStatus(401);
  }

  const response = await updateGames();
  return res.json(response);
};

export const getGames = async (
  _req: Request<{}, {}, {}>,
  res: Response
): Promise<Response> => {
  logger.info(`API call: GET ${ApiEndpoint.GAMES}`);

  const response = await fetchGames();
  return res.json(response);
};
