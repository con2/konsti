import { Request, Response } from "express";
import {
  authorizeUsingApiKey,
  getAuthorizedUsername,
} from "server/utils/authHeader";
import { UserGroup } from "shared/types/models/user";
import { fetchGames, updateGames } from "server/features/game/gamesService";
import { logger } from "server/utils/logger";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { autoUpdateGames } from "server/utils/cron";

export const postUpdateGames = async (
  req: Request<{}, {}, {}>,
  res: Response,
): Promise<Response> => {
  logger.info(`API call: POST ${ApiEndpoint.GAMES}`);

  const username = getAuthorizedUsername(
    req.headers.authorization,
    UserGroup.ADMIN,
  );
  if (!username) {
    return res.sendStatus(401);
  }

  const response = await updateGames();
  return res.json(response);
};

export const postAutoUpdateGames = (
  req: Request<{}, {}, {}>,
  res: Response,
): Response => {
  logger.info(`API call: POST ${ApiEndpoint.PROGRAM_UPDATE_CRON}`);

  const validAuthorization = authorizeUsingApiKey(req.headers.authorization);
  if (!validAuthorization) {
    return res.sendStatus(401);
  }

  autoUpdateGames().catch((error: unknown) => {
    logger.error("autoUpdateGames failed: %s", error);
  });

  return res.sendStatus(200);
};

export const getGames = async (
  _req: Request<{}, {}, {}>,
  res: Response,
): Promise<Response> => {
  logger.info(`API call: GET ${ApiEndpoint.GAMES}`);

  const response = await fetchGames();
  return res.json(response);
};
